"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { firstParagraph } from "@/lib/markdown-lead";
import { interpolate } from "@/lib/runner/messages";
import { SimpleMarkdown } from "./SimpleMarkdown";

export type WorkspaceSolution = {
  label: string;
  code: string;
  note?: string;
  /** Objašnjenje po linijama (već na izabranom jeziku); izostavljeno ako ga rešenje nema. */
  steps?: { from: number; to: number; text: string }[];
};

export type ActiveStep = { solution: number; step: number };

type Props = {
  solutions: WorkspaceSolution[];
  /** Rešenje je vidljivo: zadatak je rešen ili je rešenje već otvoreno. */
  unlocked: boolean;
  /** Poziva se kad korisnik potvrdi otvaranje; beleži "rešeno uz pomoć". */
  onReveal: () => void;
  /** Zadatak je rešen uz pomoć, pa se prikazuje napomena. */
  helped: boolean;
  /** Korak koji je trenutno otvoren u editoru. */
  activeStep: ActiveStep | null;
  /** Otvara korak u editoru, sa detaljnim objašnjenjem. */
  onOpenStep: (solution: number, step: number) => void;
  labels: Dictionary["workspace"];
};

const button =
  "rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";

function CodeLines({ lines, start }: { lines: string[]; start: number }) {
  return (
    <pre className="overflow-x-auto rounded bg-zinc-200 py-2 font-mono text-sm dark:bg-zinc-800">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-3 px-3">
          <span aria-hidden className="w-6 shrink-0 select-none text-right text-zinc-500">
            {start + i}
          </span>
          <code className="whitespace-pre">{line || " "}</code>
        </div>
      ))}
    </pre>
  );
}

export function SolutionsPanel({ solutions, unlocked, onReveal, helped, activeStep, onOpenStep, labels }: Props) {
  const [confirming, setConfirming] = useState(false);

  if (solutions.length === 0) return <p className="text-sm text-zinc-500">{labels.noSolutions}</p>;

  if (!unlocked) {
    return (
      <div className="space-y-3 text-sm">
        <h3 className="font-semibold">{labels.solutionsLockedTitle}</h3>
        <p className="text-zinc-500">{labels.solutionsLockedText}</p>

        {confirming ? (
          <div role="alertdialog" aria-label={labels.showSolution} className="space-y-3 rounded border border-orange-500/50 bg-orange-500/10 p-3">
            <p>{labels.solutionConfirm}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReveal}
                className="rounded bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-500"
              >
                {labels.solutionConfirmYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={button}>
                {labels.solutionConfirmNo}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={button}>
            {labels.showSolution}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {helped && (
        <p className="rounded border border-orange-500/50 bg-orange-500/10 p-2 text-sm text-orange-800 dark:text-orange-300">
          {labels.solutionHelpNote}
        </p>
      )}

      {solutions.map((solution, index) => {
        const lines = solution.code.split("\n");
        return (
          <article key={index} className="space-y-4">
            <h3 className="font-semibold">
              {interpolate(labels.solutionOf, { n: index + 1, label: solution.label })}
            </h3>

            {solution.steps ? (
              <>
                <p className="text-xs text-zinc-500">{labels.stepsHint}</p>
                <ol className="space-y-3">
                  {solution.steps.map((step, i) => {
                    const active = activeStep?.solution === index && activeStep.step === i;
                    return (
                      <li
                        key={i}
                        onClick={() => onOpenStep(index, i)}
                        className={`cursor-pointer space-y-2 rounded-lg border p-3 transition-colors ${
                          active
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            {step.from === step.to
                              ? interpolate(labels.linesOne, { from: step.from })
                              : interpolate(labels.linesRange, { from: step.from, to: step.to })}
                          </p>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStep(index, i);
                            }}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {labels.openInEditor} →
                          </button>
                        </div>
                        <CodeLines lines={lines.slice(step.from - 1, step.to)} start={step.from} />
                        <SimpleMarkdown source={firstParagraph(step.text)} />
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <p className="text-sm text-zinc-500">{labels.noWalkthrough}</p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{labels.fullCode}</p>
              <CodeLines lines={lines} start={1} />
            </div>

            {solution.note && (
              <div className="rounded border-l-2 border-blue-500 bg-blue-500/5 p-3">
                <SimpleMarkdown source={solution.note} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
