import type { LogEntry } from "@/lib/runner/types";

const COLORS: Record<LogEntry["level"], string> = {
  log: "text-zinc-800 dark:text-zinc-200",
  warn: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
};

type Props = {
  title: string;
  emptyLabel: string;
  logs: LogEntry[];
};

export function OutputConsole({ title, emptyLabel, logs }: Props) {
  return (
    <section aria-label={title} className="flex h-full min-h-0 flex-col">
      <h2 className="shrink-0 border-b border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
        {title}
      </h2>
      <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm">
        {logs.length === 0 ? (
          <p className="text-zinc-500">{emptyLabel}</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`whitespace-pre-wrap break-words ${COLORS[log.level]}`}>
              {log.text}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
