import { z } from "zod";

export const AREAS = ["javascript", "typescript", "react-next", "node"] as const;
export const LEVELS = ["pocetnik", "srednji", "expert"] as const;
export const RUNTIMES = ["worker", "worker-ts", "types", "iframe-react", "webcontainer"] as const;

export const AreaSchema = z.enum(AREAS);
export const LevelSchema = z.enum(LEVELS);
export const RuntimeSchema = z.enum(RUNTIMES);

export type Area = z.infer<typeof AreaSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type Runtime = z.infer<typeof RuntimeSchema>;

export const AREA_LABELS: Record<Area, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  "react-next": "React/Next.js",
  node: "Node.js",
};

export const LEVEL_LABELS: Record<Level, string> = {
  pocetnik: "početnik",
  srednji: "srednji",
  expert: "expert",
};

const SolutionSchema = z.strictObject({
  label: z.string().min(1),
  code: z.string().min(1),
  note: z.string().optional(),
});

// ID se koristi u URL-u i u napretku, zato samo mala slova, brojevi i crtice.
const IdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id sme da sadrži samo mala slova, brojeve i crtice");

const BaseFields = {
  id: IdSchema,
  title: z.string().min(1),
  area: AreaSchema,
  level: LevelSchema,
  runtime: RuntimeSchema,
  tags: z.array(z.string().min(1)).default([]),
};

export const ClassicExerciseSchema = z.strictObject({
  ...BaseFields,
  type: z.literal("classic"),
  description: z.string().min(1),
  starterCode: z.string(),
  tests: z.string().min(1),
  hiddenTests: z.string().optional(),
  solutions: z.array(SolutionSchema).min(1),
});

export const BugHuntExerciseSchema = z.strictObject({
  ...BaseFields,
  type: z.literal("bug-hunt"),
  context: z.string().min(1),
  buggyCode: z.string().min(1),
  tests: z.string().min(1),
  hiddenTests: z.string().optional(),
  bugExplanation: z.string().min(1),
});

// code-review, fix-the-prompt i code-reading se dodaju u Fazi 4.
export const ExerciseSchema = z.discriminatedUnion("type", [ClassicExerciseSchema, BugHuntExerciseSchema]);

export type ClassicExercise = z.infer<typeof ClassicExerciseSchema>;
export type BugHuntExercise = z.infer<typeof BugHuntExerciseSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseType = Exercise["type"];

export const TrackSchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  exercises: z.array(IdSchema).min(1),
});

export type Track = z.infer<typeof TrackSchema>;
