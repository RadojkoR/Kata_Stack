import { z } from "zod";
import { ExerciseSchema, TrackSchema, type Exercise, type Solution, type Track } from "@/types/exercise";

export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentError";
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.length ? i.path.join(".") : "(koren)"}: ${i.message}`)
    .join("\n");
}

function parseJson(file: string, raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new ContentError(`${file}: nije validan JSON (${(e as Error).message})`);
  }
}

/**
 * `file` je putanja relativna u odnosu na `content/exercises`, npr. `javascript/pocetnik/sum-01.json`.
 * Fajl mora da leži u folderu koji odgovara njegovim poljima `area` i `level`.
 */
export function parseExerciseFile(file: string, raw: string): Exercise {
  const result = ExerciseSchema.safeParse(parseJson(file, raw));
  if (!result.success) {
    throw new ContentError(`${file}: neispravan zadatak\n${formatIssues(result.error)}`);
  }
  const exercise = result.data;

  const [area, level] = file.split("/");
  if (area !== exercise.area || level !== exercise.level) {
    throw new ContentError(
      `${file}: fajl je u folderu ${area}/${level}, a zadatak kaže ${exercise.area}/${exercise.level}`,
    );
  }

  if (exercise.type === "classic") {
    for (const [i, solution] of exercise.solutions.entries()) {
      const problem = walkthroughProblem(solution.code, solution.walkthrough);
      if (problem) throw new ContentError(`${file}: rešenje ${i + 1}, objašnjenje po linijama: ${problem}`);
    }
  }
  return exercise;
}

/**
 * Objašnjenje po linijama mora da bude potpuno: svaki opseg je unutar koda i ide od manjeg ka većem broju,
 * a svaka linija koja nije prazna je pokrivena bar jednim opsegom. Vraća opis problema ili `null`.
 */
export function walkthroughProblem(code: string, walkthrough: Solution["walkthrough"]): string | null {
  if (!walkthrough) return null;

  const lines = code.split("\n");
  const covered = new Set<number>();
  for (const [i, step] of walkthrough.entries()) {
    const [from, to] = step.lines;
    if (from > to) return `korak ${i + 1}: opseg ${from}–${to} ide unazad`;
    if (to > lines.length) return `korak ${i + 1}: linija ${to} ne postoji (kod ima ${lines.length} linija)`;
    for (let n = from; n <= to; n++) covered.add(n);
  }

  const missing = lines.flatMap((line, i) => (line.trim() !== "" && !covered.has(i + 1) ? [i + 1] : []));
  return missing.length ? `nema objašnjenja za linije: ${missing.join(", ")}` : null;
}

export function parseTrackFile(file: string, raw: string): Track {
  const result = TrackSchema.safeParse(parseJson(file, raw));
  if (!result.success) {
    throw new ContentError(`${file}: neispravna staza\n${formatIssues(result.error)}`);
  }
  return result.data;
}

export type Catalog = {
  exercises: Exercise[];
  tracks: Track[];
};

/** Provere koje važe nad celim skupom: jedinstveni id-jevi i staze koje pokazuju na postojeće zadatke. */
export function buildCatalog(
  exercises: { file: string; exercise: Exercise }[],
  tracks: { file: string; track: Track }[],
): Catalog {
  const seen = new Map<string, string>();
  for (const { file, exercise } of exercises) {
    const first = seen.get(exercise.id);
    if (first) {
      throw new ContentError(`Dupliran id zadatka "${exercise.id}": ${first} i ${file}`);
    }
    seen.set(exercise.id, file);
  }

  const trackIds = new Set<string>();
  for (const { file, track } of tracks) {
    if (trackIds.has(track.id)) {
      throw new ContentError(`${file}: dupliran id staze "${track.id}"`);
    }
    trackIds.add(track.id);

    const missing = track.exercises.filter((id) => !seen.has(id));
    if (missing.length) {
      throw new ContentError(`${file}: staza "${track.id}" navodi zadatke koji ne postoje: ${missing.join(", ")}`);
    }
  }

  return { exercises: exercises.map((e) => e.exercise), tracks: tracks.map((t) => t.track) };
}
