import type { Attempt, ExerciseProgress, ProgressExport } from "@/types/progress";

/** Čista pravila o napretku. Ne zavise od mesta čuvanja, pa važe i za localStorage i za bazu. */

export const MAX_ATTEMPTS_PER_EXERCISE = 20;

export function newProgress(exerciseId: string, now: string): ExerciseProgress {
  return {
    exerciseId,
    status: "in_progress",
    hintLevel: 0,
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    updatedAt: now,
  };
}

/**
 * Primenjuje pokušaj na napredak. Uspešan Submit rešava zadatak; kasniji neuspešni pokušaji
 * ne poništavaju rešenje. Rešenje uz treći nivo pomoći se vodi kao `solved_with_help`.
 */
export function applyAttempt(prev: ExerciseProgress | null, attempt: Attempt): ExerciseProgress {
  const progress = prev ?? newProgress(attempt.exerciseId, attempt.createdAt);
  const next: ExerciseProgress = { ...progress, updatedAt: attempt.createdAt };

  const alreadySolved = progress.status !== "in_progress";
  if (attempt.kind === "submit" && attempt.passed) {
    if (!alreadySolved) {
      next.status = progress.hintLevel === 3 ? "solved_with_help" : "solved";
      next.solvedAt = attempt.createdAt;
    }
    next.bestTimeMs = Math.min(progress.bestTimeMs ?? Infinity, attempt.durationMs);
  }
  return next;
}

/**
 * Otvaranje rešenja pre nego što je zadatak rešen: beleži se najviši nivo pomoći (3), pa će kasniji uspešan
 * Submit biti `solved_with_help`. Već rešen zadatak se ne menja (nema "snižavanja" ocene).
 */
export function applySolutionViewed(prev: ExerciseProgress | null, exerciseId: string, now: string): ExerciseProgress {
  const progress = prev ?? newProgress(exerciseId, now);
  if (progress.status !== "in_progress" || progress.hintLevel === 3) return progress;
  return { ...progress, hintLevel: 3, updatedAt: now };
}

/** Zadržava poslednjih `max` pokušaja po zadatku; redosled ostaje od starijeg ka novijem. */
export function capAttempts(attempts: Attempt[], max = MAX_ATTEMPTS_PER_EXERCISE): Attempt[] {
  const counts = new Map<string, number>();
  const keep = new Set<Attempt>();
  for (let i = attempts.length - 1; i >= 0; i--) {
    const a = attempts[i];
    const n = (counts.get(a.exerciseId) ?? 0) + 1;
    counts.set(a.exerciseId, n);
    if (n <= max) keep.add(a);
  }
  return attempts.filter((a) => keep.has(a));
}

const attemptKey = (a: Attempt) => `${a.exerciseId}|${a.kind}|${a.createdAt}`;

/** Spaja dva skupa podataka: za isti zadatak pobeđuje noviji `updatedAt`, pokušaji se spajaju bez duplikata. */
export function mergeProgress(
  current: { progress: ExerciseProgress[]; attempts: Attempt[] },
  incoming: Pick<ProgressExport, "progress" | "attempts">,
): { progress: ExerciseProgress[]; attempts: Attempt[] } {
  const byId = new Map(current.progress.map((p) => [p.exerciseId, p]));
  for (const p of incoming.progress) {
    const existing = byId.get(p.exerciseId);
    if (!existing || p.updatedAt > existing.updatedAt) byId.set(p.exerciseId, p);
  }

  const seen = new Set(current.attempts.map(attemptKey));
  const attempts = [...current.attempts];
  for (const a of incoming.attempts) {
    if (!seen.has(attemptKey(a))) {
      seen.add(attemptKey(a));
      attempts.push(a);
    }
  }
  attempts.sort((x, y) => x.createdAt.localeCompare(y.createdAt));

  return { progress: [...byId.values()], attempts: capAttempts(attempts) };
}
