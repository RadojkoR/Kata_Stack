"use client";

import { useExerciseProgress } from "@/lib/storage/use-progress";
import { isSolved } from "@/types/progress";

/** Oznaka "rešeno" uz zadatak u listi. Na serveru se ne prikazuje (napredak je u browseru). */
export function SolvedMark({ exerciseId, label }: { exerciseId: string; label: string }) {
  const progress = useExerciseProgress(exerciseId);
  if (!isSolved(progress)) return null;

  return (
    <span className="ml-2 rounded bg-green-500/15 px-1.5 py-0.5 text-xs font-normal text-green-700 dark:text-green-400">
      ✓ {label}
    </span>
  );
}
