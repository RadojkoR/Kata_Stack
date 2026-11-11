import { z } from "zod";
import { LocalizedStringSchema } from "@/i18n/localized";

export const AREAS = ["javascript", "typescript", "react-next", "node"] as const;
export const LEVELS = ["pocetnik", "srednji", "expert"] as const;
export const RUNTIMES = ["worker", "worker-ts", "types", "iframe-react", "webcontainer"] as const;

export const AreaSchema = z.enum(AREAS);
export const LevelSchema = z.enum(LEVELS);
export const RuntimeSchema = z.enum(RUNTIMES);

export type Area = z.infer<typeof AreaSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;

/** Objašnjenje jedne linije ili grupe linija rešenja. `lines` je [od, do], brojanje od 1, oba uključena. */
const WalkthroughStepSchema = z.strictObject({
  lines: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  text: LocalizedStringSchema,
});

const SolutionSchema = z.strictObject({
  label: LocalizedStringSchema,
  code: z.string().min(1),
  /** Kratak zaključak ispod objašnjenja. */
  note: LocalizedStringSchema.optional(),
  /** Objašnjenje po linijama; ako postoji, mora da pokrije svaku linijsku koja nije prazna (proverava `lib/catalog.ts`). */
  walkthrough: z.array(WalkthroughStepSchema).min(1).optional(),
});

export type WalkthroughStep = z.infer<typeof WalkthroughStepSchema>;
export type Solution = z.infer<typeof SolutionSchema>;

// ID se koristi u URL-u i u napretku, zato samo mala slova, brojevi i crtice.
const IdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id sme da sadrži samo mala slova, brojeve i crtice");

const BaseFields = {
  id: IdSchema,
  title: LocalizedStringSchema,
  area: AreaSchema,
  level: LevelSchema,
  runtime: RuntimeSchema,
  tags: z.array(z.string().min(1)).default([]),
};

export const ClassicExerciseSchema = z.strictObject({
  ...BaseFields,
  type: z.literal("classic"),
  description: LocalizedStringSchema,
  starterCode: z.string(),
  tests: z.string().min(1),
  hiddenTests: z.string().optional(),
  solutions: z.array(SolutionSchema).min(1),
});

export const BugHuntExerciseSchema = z.strictObject({
  ...BaseFields,
  type: z.literal("bug-hunt"),
  context: LocalizedStringSchema,
  buggyCode: z.string().min(1),
  tests: z.string().min(1),
  hiddenTests: z.string().optional(),
  bugExplanation: LocalizedStringSchema,
});

// code-review, fix-the-prompt i code-reading se dodaju u Fazi 4.
export const ExerciseSchema = z.discriminatedUnion("type", [ClassicExerciseSchema, BugHuntExerciseSchema]);

export type ClassicExercise = z.infer<typeof ClassicExerciseSchema>;
export type BugHuntExercise = z.infer<typeof BugHuntExerciseSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseType = Exercise["type"];

export const TrackSchema = z.strictObject({
  id: IdSchema,
  title: LocalizedStringSchema,
  exercises: z.array(IdSchema).min(1),
});

export type Track = z.infer<typeof TrackSchema>;

/**
 * Redosled prikaza zadataka jedne oblasti (`content/order/<oblast>.json`): za svaki nivo spisak id-jeva.
 * Nivo koji nije naveden nema zadataka u redosledu.
 */
export const OrderSchema = z.strictObject({
  pocetnik: z.array(IdSchema).optional(),
  srednji: z.array(IdSchema).optional(),
  expert: z.array(IdSchema).optional(),
});

export type Order = z.infer<typeof OrderSchema>;
