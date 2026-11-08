import fs from "node:fs";
import path from "node:path";
import { buildCatalog, parseExerciseFile, parseTrackFile, type Catalog } from "./catalog";
import type { Area, Exercise, Level, Track } from "@/types/exercise";

const CONTENT_DIR = path.join(process.cwd(), "content");

function listJson(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((f) => f.replaceAll("\\", "/"))
    .filter((f) => f.endsWith(".json"))
    .sort();
}

function loadCatalog(): Catalog {
  const exercisesDir = path.join(CONTENT_DIR, "exercises");
  const tracksDir = path.join(CONTENT_DIR, "tracks");

  const exercises = listJson(exercisesDir).map((file) => ({
    file,
    exercise: parseExerciseFile(file, fs.readFileSync(path.join(exercisesDir, file), "utf8")),
  }));
  const tracks = listJson(tracksDir).map((file) => ({
    file,
    track: parseTrackFile(file, fs.readFileSync(path.join(tracksDir, file), "utf8")),
  }));

  return buildCatalog(exercises, tracks);
}

let cached: Catalog | undefined;

/**
 * Sinhrono čitanje fajlova: uđe u build, a nevalidan sadržaj obara `npm run build`.
 * U razvoju se sadržaj čita iznova pri svakom pristupu (to je 15-ak malih fajlova), da izmena
 * JSON-a zadatka ne traži restart servera.
 */
function catalog(): Catalog {
  if (process.env.NODE_ENV === "development" || !cached) cached = loadCatalog();
  return cached;
}

export function getExercises(filter?: { area?: Area; level?: Level }): Exercise[] {
  return catalog().exercises.filter(
    (e) => (!filter?.area || e.area === filter.area) && (!filter?.level || e.level === filter.level),
  );
}

export function getExercise(id: string): Exercise | undefined {
  return catalog().exercises.find((e) => e.id === id);
}

export function getTracks(): Track[] {
  return catalog().tracks;
}

export function getTrack(id: string): Track | undefined {
  return catalog().tracks.find((t) => t.id === id);
}
