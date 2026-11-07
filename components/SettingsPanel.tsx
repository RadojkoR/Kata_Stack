"use client";

import { useRef, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { exportFileName, parseExportFile, summarizeExport } from "@/lib/storage/exportImport";
import { interpolate } from "@/lib/runner/messages";
import { getProgressStore } from "@/lib/storage";
import type { ImportMode } from "@/lib/storage/ProgressStore";
import type { ProgressExport } from "@/types/progress";

type Props = { labels: Dictionary["settings"] };

type Message = { kind: "ok" | "error"; text: string };

const button =
  "rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

export function SettingsPanel({ labels }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ProgressExport | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  async function exportJson() {
    const data = await getProgressStore().exportAll();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName(new Date());
    link.click();
    URL.revokeObjectURL(url);
  }

  async function chooseFile(file: File | undefined) {
    setMessage(null);
    setPending(null);
    if (!file) return;

    const parsed = parseExportFile(await file.text());
    if (parsed.ok) setPending(parsed.data);
    else setMessage({ kind: "error", text: interpolate(labels.importInvalid, { reason: parsed.reason }) });
  }

  function reset() {
    setPending(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function applyImport(mode: ImportMode) {
    if (!pending) return;
    const count = await getProgressStore().importAll(pending, mode);
    setMessage({ kind: "ok", text: interpolate(labels.importDone, { count }) });
    reset();
  }

  const summary = pending ? summarizeExport(pending) : null;

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-500">{labels.intro}</p>

      <section className="space-y-2">
        <h2 className="font-semibold">{labels.exportTitle}</h2>
        <p className="text-sm text-zinc-500">{labels.exportDescription}</p>
        <button type="button" className={button} onClick={() => void exportJson()}>
          {labels.exportButton}
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{labels.importTitle}</h2>
        <p className="text-sm text-zinc-500">{labels.importDescription}</p>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label={labels.importChoose}
          onChange={(e) => void chooseFile(e.target.files?.[0])}
          className="block text-sm file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-transparent file:px-3 file:py-1.5 dark:file:border-zinc-700"
        />

        {summary && (
          <div className="space-y-3 rounded border border-zinc-300 p-3 dark:border-zinc-700">
            <p className="text-sm">{interpolate(labels.importSummary, summary)}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => void applyImport("merge")} title={labels.importMergeHint}>
                {labels.importMerge}
              </button>
              <button
                type="button"
                className={`${button} border-red-500 text-red-600 dark:text-red-400`}
                onClick={() => void applyImport("replace")}
                title={labels.importReplaceHint}
              >
                {labels.importReplace}
              </button>
              <button type="button" className={button} onClick={reset}>
                {labels.importCancel}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {labels.importMerge}: {labels.importMergeHint} {labels.importReplace}: {labels.importReplaceHint}
            </p>
          </div>
        )}

        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={message.kind === "error" ? "text-sm text-red-600 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}
          >
            {message.text}
          </p>
        )}
      </section>
    </div>
  );
}
