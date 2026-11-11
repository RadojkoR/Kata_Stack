import { z } from "zod";
import {
  AREAS,
  LEVELS,
  ExerciseSchema,
  OrderSchema,
  TrackSchema,
  type Area,
  type Exercise,
  type Order,
  type Solution,
  type Track,
} from "@/types/exercise";

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

/**
 * `file` je putanja relativna u odnosu na `content/order`, npr. `javascript.json`.
 * Ime fajla je oblast na koju se redosled odnosi.
 */
export function parseOrderFile(file: string, raw: string): { area: Area; order: Order } {
  const result = OrderSchema.safeParse(parseJson(file, raw));
  if (!result.success) {
    throw new ContentError(`${file}: neispravan redosled\n${formatIssues(result.error)}`);
  }
  const name = file.replace(/\.json$/, "");
  const area = AREAS.find((a) => a === name);
  if (!area) {
    throw new ContentError(`${file}: ime fajla mora biti oblast (${AREAS.join(", ")})`);
  }
  return { area, order: result.data };
}

export type Catalog = {
  exercises: Exercise[];
  tracks: Track[];
};

/** Provere koje važe nad celim skupom: jedinstveni id-jevi i staze koje pokazuju na postojeće zadatke. */
export function buildCatalog(
  exercises: { file: string; exercise: Exercise }[],
  tracks: { file: string; track: Track }[],
  orders: { file: string; area: Area; order: Order }[] = [],
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

  const orderedIds = checkOrders(exercises, orders);
  return { exercises: sortExercises(exercises.map((e) => e.exercise), orderedIds), tracks: tracks.map((t) => t.track) };
}

/**
 * Provere fajlova redosleda: svaki id postoji u toj oblasti i tom nivou, nijedan se ne ponavlja,
 * i svaki zadatak oblasti koja ima fajl redosleda je upisan. Vraća mesto svakog id-a u njegovom nivou.
 */
function checkOrders(
  exercises: { file: string; exercise: Exercise }[],
  orders: { file: string; area: Area; order: Order }[],
): Map<string, number> {
  const position = new Map<string, number>();
  const seenAreas = new Set<Area>();

  for (const { file, area, order } of orders) {
    if (seenAreas.has(area)) throw new ContentError(`${file}: dupliran redosled za oblast "${area}"`);
    seenAreas.add(area);

    const listed = new Set<string>();
    for (const level of LEVELS) {
      for (const [i, id] of (order[level] ?? []).entries()) {
        if (listed.has(id)) throw new ContentError(`${file}: id "${id}" je naveden više puta`);
        listed.add(id);

        const exercise = exercises.find((e) => e.exercise.id === id)?.exercise;
        if (!exercise || exercise.area !== area || exercise.level !== level) {
          throw new ContentError(`${file}: "${id}" nije zadatak oblasti ${area} i nivoa ${level}`);
        }
        position.set(id, i);
      }
    }

    const missing = exercises.filter((e) => e.exercise.area === area && !listed.has(e.exercise.id)).map((e) => e.exercise.id);
    if (missing.length) {
      throw new ContentError(`${file}: zadaci nisu upisani u redosled: ${missing.join(", ")}`);
    }
  }
  return position;
}

/** Oblast, pa nivo, pa mesto u redosledu. Zadaci bez mesta (oblast bez fajla redosleda) ostaju po abecedi iza ostalih. */
function sortExercises(exercises: Exercise[], position: Map<string, number>): Exercise[] {
  return exercises
    .map((exercise, index) => ({ exercise, index }))
    .sort((a, b) => {
      const byArea = AREAS.indexOf(a.exercise.area) - AREAS.indexOf(b.exercise.area);
      if (byArea) return byArea;
      const byLevel = LEVELS.indexOf(a.exercise.level) - LEVELS.indexOf(b.exercise.level);
      if (byLevel) return byLevel;
      const pa = position.get(a.exercise.id) ?? Infinity;
      const pb = position.get(b.exercise.id) ?? Infinity;
      return pa === pb ? a.index - b.index : pa - pb;
    })
    .map((e) => e.exercise);
}
