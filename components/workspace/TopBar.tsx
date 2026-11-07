import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";

type Props = {
  title: string;
  backHref: string;
  labels: Dictionary["workspace"];
  running: "run" | "submit" | null;
  resetArmed: boolean;
  focus: boolean;
  elapsedSeconds: number;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onFormat: () => void;
  onToggleFocus: () => void;
};

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const button =
  "rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export function TopBar({
  title,
  backHref,
  labels,
  running,
  resetArmed,
  focus,
  elapsedSeconds,
  onRun,
  onSubmit,
  onReset,
  onFormat,
  onToggleFocus,
}: Props) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-zinc-200 px-3 dark:border-zinc-800">
      <Link href={backHref} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← {labels.back}
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>

      <span className="font-mono text-sm tabular-nums text-zinc-500" title={labels.timer}>
        ⏱ {formatTime(elapsedSeconds)}
      </span>

      <button type="button" onClick={onFormat} className={button}>
        {labels.format}
      </button>
      <button
        type="button"
        onClick={onReset}
        className={`${button} ${resetArmed ? "border-red-500 text-red-600 dark:text-red-400" : ""}`}
      >
        {resetArmed ? labels.resetConfirm : labels.reset}
      </button>
      <button type="button" onClick={onToggleFocus} aria-pressed={focus} className={button}>
        {focus ? labels.exitFocus : labels.focus}
      </button>
      <button type="button" onClick={onRun} disabled={running !== null} title={labels.shortcuts} className={button}>
        {running === "run" ? labels.statusRunning : `▶ ${labels.run}`}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={running !== null}
        title={labels.shortcuts}
        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {running === "submit" ? labels.statusRunning : `✓ ${labels.submit}`}
      </button>
    </div>
  );
}
