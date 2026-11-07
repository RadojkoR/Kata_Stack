"use client";

import { loader } from "@monaco-editor/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Group, Panel, Separator, useDefaultLayout, usePanelRef } from "react-resizable-panels";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { clearDraft, loadDraft, saveDraft } from "@/lib/drafts";
import { createMonacoTypeChecker } from "@/lib/monaco/setup";
import { createBrowserWorker } from "@/lib/runner/browser-worker";
import { runCode, UnsupportedRuntimeError, type RunnerDeps } from "@/lib/runner";
import { allPassed, type LogEntry } from "@/lib/runner/types";
import { getProgressStore } from "@/lib/storage";
import { createSafeStorage } from "@/lib/storage/browser";
import { useExerciseProgress } from "@/lib/storage/use-progress";
import { useTheme } from "@/lib/use-theme";
import type { Runtime } from "@/types/exercise";
import { isSolved } from "@/types/progress";
import { CodeEditor, type CodeEditorHandle } from "./CodeEditor";
import { NotesPanel } from "./NotesPanel";
import { OutputConsole } from "./OutputConsole";
import { SimpleMarkdown } from "./SimpleMarkdown";
import { TestResults, type Outcome } from "./TestResults";
import { TopBar } from "./TopBar";

export type WorkspaceExercise = {
  id: string;
  title: string;
  description: string;
  /** Oblast, nivo i tagovi, već prevedeni. */
  meta: string[];
  runtime: Runtime;
  starterCode: string;
  tests: string;
  hiddenTests?: string;
};

type Props = {
  exercise: WorkspaceExercise;
  locale: Locale;
  backHref: string;
  labels: Dictionary["workspace"];
  runnerLabels: Dictionary["runner"];
};

const DRAFT_SAVE_DELAY_MS = 500;

const subscribeNothing = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

const resizeHandle =
  "bg-zinc-200 transition-colors hover:bg-blue-500 data-[separator=active]:bg-blue-500 dark:bg-zinc-800 data-[orientation=vertical]:w-px";

export function Workspace({ exercise, locale, backHref, labels, runnerLabels }: Props) {
  const isClient = useIsClient();
  const theme = useTheme();
  const storage = useMemo(() => createSafeStorage(), []);
  const progress = useExerciseProgress(exercise.id);

  // Kod se čita tek na klijentu (localStorage), pa se editor iscrtava posle toga.
  const initialCode = useMemo(
    () => (isClient ? (loadDraft(storage, exercise.id) ?? exercise.starterCode) : null),
    [isClient, storage, exercise.id, exercise.starterCode],
  );

  const horizontal = useDefaultLayout({ id: "workspace-h", storage });
  const vertical = useDefaultLayout({ id: "workspace-v", storage });
  const taskPanel = usePanelRef();
  const feedbackPanel = usePanelRef();
  const consolePanel = usePanelRef();

  const [code, setCode] = useState<string | null>(null);
  const currentCode = code ?? initialCode ?? exercise.starterCode;
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState<"run" | "submit" | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [focus, setFocus] = useState(false);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"task" | "notes">("task");

  const editorRef = useRef<CodeEditorHandle | null>(null);
  const openedAt = useRef(0);
  const isTs = exercise.runtime !== "worker";

  useEffect(() => {
    openedAt.current = Date.now();
  }, [exercise.id]);

  // --- tajmer: staje kad je zadatak rešen
  useEffect(() => {
    if (solved) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [solved]);

  // --- nacrt koda: čuva se sa zakašnjenjem; kod jednak početnom nema nacrt
  useEffect(() => {
    if (code === null) return;
    const id = setTimeout(() => {
      if (code === exercise.starterCode) clearDraft(storage, exercise.id);
      else saveDraft(storage, exercise.id, code);
    }, DRAFT_SAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [code, storage, exercise.id, exercise.starterCode]);

  const deps = useMemo<RunnerDeps>(
    () => ({ createWorker: createBrowserWorker, typeCheck: createMonacoTypeChecker(() => loader.init()) }),
    [],
  );

  const run = useCallback(
    async (kind: "run" | "submit") => {
      if (running) return;
      setRunning(kind);
      setNotice(null);
      try {
        const submittedCode = editorRef.current?.editor.getValue() ?? currentCode;
        const result = await runCode(
          exercise.runtime,
          {
            code: submittedCode,
            tests: exercise.tests,
            hiddenTests: kind === "submit" ? exercise.hiddenTests : undefined,
          },
          deps,
        );
        setOutcome({ kind, result });
        // Pokušaj se beleži u napredak; uspešan Submit označava zadatak kao rešen.
        void getProgressStore().recordAttempt({
          exerciseId: exercise.id,
          kind,
          passed: allPassed(result),
          durationMs: Math.max(0, Date.now() - openedAt.current),
          code: submittedCode,
        });
        setLogs(result.logs);
        if (kind === "submit" && allPassed(result)) setSolved(true);
        if (result.logs.length > 0 && consolePanel.current?.isCollapsed()) consolePanel.current.expand();
      } catch (e) {
        setNotice(e instanceof UnsupportedRuntimeError ? labels.unsupportedRuntime : String(e));
      } finally {
        setRunning(null);
      }
    },
    [running, exercise, currentCode, deps, labels.unsupportedRuntime, consolePanel],
  );

  const toggleFocus = useCallback(() => {
    setFocus((was) => {
      for (const ref of [taskPanel, feedbackPanel, consolePanel]) {
        if (was) ref.current?.expand();
        else ref.current?.collapse();
      }
      return !was;
    });
  }, [taskPanel, feedbackPanel, consolePanel]);

  const reset = useCallback(() => {
    if (!resetArmed) {
      setResetArmed(true);
      setTimeout(() => setResetArmed(false), 3000);
      return;
    }
    setResetArmed(false);
    editorRef.current?.editor.setValue(exercise.starterCode);
    clearDraft(storage, exercise.id);
    setOutcome(null);
    setLogs([]);
    setSolved(false);
  }, [resetArmed, exercise.starterCode, exercise.id, storage]);

  const format = useCallback(async () => {
    const handle = editorRef.current;
    if (!handle) return;
    try {
      const [prettier, babel, estree, typescript] = await Promise.all([
        import("prettier/standalone"),
        import("prettier/plugins/babel"),
        import("prettier/plugins/estree"),
        import("prettier/plugins/typescript"),
      ]);
      const formatted = await prettier.format(handle.editor.getValue(), {
        parser: isTs ? "typescript" : "babel",
        plugins: [babel, estree, typescript],
      });
      const model = handle.editor.getModel();
      if (model) handle.editor.executeEdits("prettier", [{ range: model.getFullModelRange(), text: formatted }]);
      setNotice(null);
    } catch {
      setNotice(labels.formatFailed);
    }
  }, [isTs, labels.formatFailed]);

  const gotoLine = useCallback((line: number) => {
    const editor = editorRef.current?.editor;
    if (!editor) return;
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  }, []);

  // Prečice van editora (unutar editora ih registruje CodeEditor).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "Enter") {
        e.preventDefault();
        void run(e.shiftKey ? "submit" : "run");
      } else if (e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFocus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, toggleFocus]);

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col">
      <TopBar
        title={exercise.title}
        backHref={backHref}
        labels={labels}
        running={running}
        resetArmed={resetArmed}
        focus={focus}
        solved={solved || isSolved(progress)}
        elapsedSeconds={elapsed}
        onRun={() => void run("run")}
        onSubmit={() => void run("submit")}
        onReset={reset}
        onFormat={() => void format()}
        onToggleFocus={toggleFocus}
      />
      {notice && (
        <p role="status" className="shrink-0 bg-amber-500/10 px-3 py-1 text-sm text-amber-700 dark:text-amber-300">
          {notice}
        </p>
      )}

      {initialCode === null ? (
        <div className="p-4 text-sm text-zinc-500">{labels.loading}</div>
      ) : (
        <Group
          orientation="horizontal"
          id="workspace-h"
          className="min-h-0 flex-1"
          defaultLayout={horizontal.defaultLayout}
          onLayoutChanged={horizontal.onLayoutChanged}
        >
          <Panel id="task" panelRef={taskPanel} collapsible collapsedSize={0} minSize="15%" defaultSize="25%">
            <div className="flex h-full min-h-0 flex-col">
              <div role="tablist" className="flex shrink-0 gap-1 border-b border-zinc-200 px-2 dark:border-zinc-800">
                {(["task", "notes"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                    className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                      tab === t ? "border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {t === "task" ? labels.tabTask : labels.tabNotes}
                  </button>
                ))}
              </div>
              <section hidden={tab !== "task"} aria-label={labels.tabTask} className="min-h-0 flex-1 overflow-auto p-4">
                <p className="mb-3 text-xs text-zinc-500">{exercise.meta.join(" · ")}</p>
                <SimpleMarkdown source={exercise.description} />
              </section>
              <section hidden={tab !== "notes"} aria-label={labels.tabNotes} className="min-h-0 flex-1 p-3">
                <NotesPanel
                  exerciseId={exercise.id}
                  initialNotes={progress?.notes ?? ""}
                  label={labels.tabNotes}
                  placeholder={labels.notesPlaceholder}
                />
              </section>
            </div>
          </Panel>
          <Separator className={resizeHandle} />

          <Panel id="editor" minSize="30%" defaultSize="45%">
            <Group
              orientation="vertical"
              id="workspace-v"
              defaultLayout={vertical.defaultLayout}
              onLayoutChanged={vertical.onLayoutChanged}
            >
              <Panel id="code" minSize="30%" defaultSize="75%">
                <CodeEditor
                  path={`file:///exercises/${exercise.id}.${isTs ? "ts" : "js"}`}
                  language={isTs ? "typescript" : "javascript"}
                  initialValue={initialCode}
                  theme={theme}
                  loadingLabel={labels.loading}
                  onChange={setCode}
                  onReady={(handle) => (editorRef.current = handle)}
                  onRun={() => void run("run")}
                  onSubmit={() => void run("submit")}
                  onToggleFocus={toggleFocus}
                />
              </Panel>
              <Separator className={`${resizeHandle} h-px data-[orientation=horizontal]:h-px`} />
              <Panel id="console" panelRef={consolePanel} collapsible collapsedSize={0} minSize="10%" defaultSize="25%">
                <OutputConsole title={labels.console} emptyLabel={labels.consoleEmpty} logs={logs} />
              </Panel>
            </Group>
          </Panel>

          <Separator className={resizeHandle} />
          <Panel id="feedback" panelRef={feedbackPanel} collapsible collapsedSize={0} minSize="15%" defaultSize="30%">
            <TestResults
              title={labels.tabTests}
              outcome={outcome}
              locale={locale}
              labels={labels}
              runnerLabels={runnerLabels}
              onGotoLine={gotoLine}
            />
          </Panel>
        </Group>
      )}
    </div>
  );
}
