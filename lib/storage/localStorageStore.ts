import { applyAttempt, capAttempts, mergeProgress, newProgress } from "@/lib/progress";
import { ProgressExportSchema, type Attempt, type ExerciseProgress, type ProgressExport } from "@/types/progress";
import type { SafeStorage } from "./browser";
import { parseAttempts, parseProgressMap } from "./parse";
import type { ImportMode, NewAttempt, ProgressStore } from "./ProgressStore";

/** Ključevi (storage dodaje prefiks `ks:`): `ks:v1:progress` i `ks:v1:attempts`. */
export const PROGRESS_KEY = "v1:progress";
export const ATTEMPTS_KEY = "v1:attempts";

export function createLocalStorageStore(
  storage: SafeStorage,
  now: () => Date = () => new Date(),
  notify: () => void = () => {},
): ProgressStore {
  // Oštećen zapis se ne briše tiho: sačuvamo ga pod `<ključ>:corrupt` i javimo u konzoli.
  const backupIfProblem = (key: string, raw: string | null, problems: number) => {
    if (problems === 0 || !raw) return;
    storage.setItem(`${key}:corrupt`, raw);
    console.warn(`Neispravni zapisi u ${key} (${problems}); preskočeni, kopija je u ${key}:corrupt.`);
  };

  const readProgress = (): Record<string, ExerciseProgress> => {
    const raw = storage.getItem(PROGRESS_KEY);
    const { value, problems } = parseProgressMap(raw);
    backupIfProblem(PROGRESS_KEY, raw, problems);
    return value;
  };

  const readAttempts = (): Attempt[] => {
    const raw = storage.getItem(ATTEMPTS_KEY);
    const { value, problems } = parseAttempts(raw);
    backupIfProblem(ATTEMPTS_KEY, raw, problems);
    return value;
  };

  const write = (progress: Record<string, ExerciseProgress>, attempts: Attempt[]) => {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    storage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    notify();
  };

  return {
    async get(exerciseId) {
      return readProgress()[exerciseId] ?? null;
    },

    async getAll() {
      return readProgress();
    },

    async getAttempts(exerciseId) {
      return readAttempts().filter((a) => a.exerciseId === exerciseId);
    },

    async recordAttempt(newAttempt: NewAttempt) {
      const attempt: Attempt = { ...newAttempt, createdAt: now().toISOString() };
      const progress = readProgress();
      const updated = applyAttempt(progress[attempt.exerciseId] ?? null, attempt);
      progress[attempt.exerciseId] = updated;
      write(progress, capAttempts([...readAttempts(), attempt]));
      return updated;
    },

    async saveNotes(exerciseId, notes) {
      const progress = readProgress();
      const existing = progress[exerciseId];
      if (!existing && notes === "") return;

      const nowIso = now().toISOString();
      progress[exerciseId] = { ...(existing ?? newProgress(exerciseId, nowIso)), notes: notes || undefined, updatedAt: nowIso };
      write(progress, readAttempts());
    },

    async exportAll(): Promise<ProgressExport> {
      return {
        version: 1,
        exportedAt: now().toISOString(),
        progress: Object.values(readProgress()),
        attempts: readAttempts(),
      };
    },

    async importAll(data: ProgressExport, mode: ImportMode) {
      const valid = ProgressExportSchema.parse(data);
      const incoming = valid.progress.map((p) => [p.exerciseId, p] as const);

      if (mode === "replace") {
        const attempts = [...valid.attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        write(Object.fromEntries(incoming), capAttempts(attempts));
      } else {
        const merged = mergeProgress(
          { progress: Object.values(readProgress()), attempts: readAttempts() },
          valid,
        );
        write(Object.fromEntries(merged.progress.map((p) => [p.exerciseId, p])), merged.attempts);
      }
      return valid.progress.length;
    },
  };
}
