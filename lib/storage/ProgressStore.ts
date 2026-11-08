import type { Attempt, ExerciseProgress, ProgressExport } from "@/types/progress";

export type NewAttempt = Omit<Attempt, "createdAt">;

export type ImportMode = "replace" | "merge";

/**
 * Jedino mesto kroz koje UI čita i piše napredak. Metode su async iako je localStorage sinhron,
 * da se u Etapi 2 (baza) promeni samo implementacija, a ne UI.
 */
export interface ProgressStore {
  get(exerciseId: string): Promise<ExerciseProgress | null>;
  getAll(): Promise<Record<string, ExerciseProgress>>;
  getAttempts(exerciseId: string): Promise<Attempt[]>;
  /** Beleži pokušaj i ažurira napredak (uspešan Submit = rešeno). Vraća novo stanje zadatka. */
  recordAttempt(attempt: NewAttempt): Promise<ExerciseProgress>;
  saveNotes(exerciseId: string, notes: string): Promise<void>;
  /** Korisnik je otvorio rešenje. Nerešen zadatak se kasnije vodi kao `solved_with_help`. */
  markSolutionViewed(exerciseId: string): Promise<ExerciseProgress>;
  exportAll(): Promise<ProgressExport>;
  /** Vraća broj uvezenih zadataka. Podaci se validiraju pre upisa. */
  importAll(data: ProgressExport, mode: ImportMode): Promise<number>;
}
