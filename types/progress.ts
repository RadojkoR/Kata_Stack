import { z } from "zod";

/**
 * Oblik podataka je isti kao tabele `exercise_progress` i `attempts` u Etapi 2 (samo camelCase),
 * da se izvoz iz localStorage-a može direktno uvesti u bazu.
 */

const IsoDate = z.iso.datetime();

export const ProgressStatusSchema = z.enum(["in_progress", "solved", "solved_with_help"]);
export const GradeSchema = z.enum(["lako", "dobro", "tesko", "nisam_znao"]);

export const ExerciseProgressSchema = z.strictObject({
  exerciseId: z.string().min(1),
  status: ProgressStatusSchema,
  solvedAt: IsoDate.optional(),
  /** Najkraće vreme od otvaranja zadatka do uspešnog Submit-a. */
  bestTimeMs: z.number().int().nonnegative().optional(),
  hintLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  notes: z.string().optional(),
  // SM-2 (koristi se od Faze 5, ali polja postoje od početka)
  repetitions: z.number().int().nonnegative(),
  easeFactor: z.number().positive(),
  intervalDays: z.number().int().nonnegative(),
  dueAt: IsoDate.optional(),
  lastGrade: GradeSchema.optional(),
  updatedAt: IsoDate,
});

export const AttemptSchema = z.strictObject({
  exerciseId: z.string().min(1),
  kind: z.enum(["run", "submit"]),
  /** Za `run`: prošli su vidljivi testovi. Za `submit`: prošli su svi testovi, i skriveni. */
  passed: z.boolean(),
  /** Vreme od otvaranja zadatka do ovog pokušaja (ne trajanje izvršavanja). */
  durationMs: z.number().int().nonnegative(),
  code: z.string(),
  createdAt: IsoDate,
});

export const ProgressExportSchema = z.strictObject({
  version: z.literal(1),
  exportedAt: IsoDate,
  progress: z.array(ExerciseProgressSchema),
  attempts: z.array(AttemptSchema),
});

export type ProgressStatus = z.infer<typeof ProgressStatusSchema>;
export type ExerciseProgress = z.infer<typeof ExerciseProgressSchema>;
export type Attempt = z.infer<typeof AttemptSchema>;
export type ProgressExport = z.infer<typeof ProgressExportSchema>;

export function isSolved(progress: Pick<ExerciseProgress, "status"> | null | undefined): boolean {
  return progress?.status === "solved" || progress?.status === "solved_with_help";
}
