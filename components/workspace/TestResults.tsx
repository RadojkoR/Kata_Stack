import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { failureMessage, interpolate, runErrorMessage, testTitle } from "@/lib/runner/messages";
import { allPassed, type RunResult } from "@/lib/runner/types";

export type Outcome = { kind: "run" | "submit"; result: RunResult };

type Props = {
  title: string;
  outcome: Outcome | null;
  locale: Locale;
  labels: Dictionary["workspace"];
  runnerLabels: Dictionary["runner"];
  onGotoLine: (line: number) => void;
};

export function TestResults({ title, outcome, locale, labels, runnerLabels, onGotoLine }: Props) {
  return (
    <section aria-label={title} className="flex h-full min-h-0 flex-col">
      <h2 className="shrink-0 border-b border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
        {title}
      </h2>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3 text-sm">
        {outcome ? (
          <Body outcome={outcome} locale={locale} labels={labels} runnerLabels={runnerLabels} onGotoLine={onGotoLine} />
        ) : (
          <p className="text-zinc-500">{labels.noRunYet}</p>
        )}
      </div>
    </section>
  );
}

function Body({ outcome, locale, labels, runnerLabels, onGotoLine }: Omit<Props, "title" | "outcome"> & { outcome: Outcome }) {
  const { kind, result } = outcome;
  const passed = result.tests.filter((t) => t.passed).length;
  const solved = kind === "submit" && allPassed(result);

  return (
    <>
      {result.error && (
        <p role="alert" className="rounded border border-red-500/40 bg-red-500/10 p-2 text-red-700 dark:text-red-300">
          {runErrorMessage(result.error, runnerLabels)}
        </p>
      )}

      {!result.error && result.tests.length === 0 && <p className="text-zinc-500">{labels.noTests}</p>}

      {result.tests.length > 0 && (
        <p className="font-medium" aria-live="polite">
          {solved
            ? labels.solved
            : interpolate(labels.passedCount, { passed, total: result.tests.length })}
        </p>
      )}

      <ul className="space-y-2">
        {result.tests.map((test, i) => {
          const message = failureMessage(test, runnerLabels);
          return (
            <li key={i} className="flex gap-2">
              <span aria-hidden className={test.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {test.passed ? "✓" : "✗"}
              </span>
              <div className="min-w-0">
                <p>{testTitle(test, locale, runnerLabels)}</p>
                {message && <p className="mt-0.5 break-words font-mono text-xs text-zinc-500">{message}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      {result.typeErrors && result.typeErrors.length > 0 && (
        <div>
          <h3 className="mb-1 font-medium">{labels.typeErrors}</h3>
          <ul className="space-y-1">
            {result.typeErrors.map((e, i) => (
              <li key={i} className="font-mono text-xs">
                <button
                  type="button"
                  onClick={() => onGotoLine(e.line)}
                  className="text-blue-600 underline underline-offset-2 dark:text-blue-400"
                >
                  {interpolate(labels.line, { n: e.line })}
                </button>
                <span className="ml-2 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{e.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {kind === "submit" && !solved && result.tests.length > 0 && !result.error && (
        <p className="text-zinc-500">{labels.submitFailed}</p>
      )}
    </>
  );
}
