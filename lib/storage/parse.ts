import { AttemptSchema, ExerciseProgressSchema, type Attempt, type ExerciseProgress } from "@/types/progress";

/** Čitanje onoga što je u localStorage-u. Nevažeći zapisi se preskaču, a `problems` kaže koliko ih je bilo. */

export type Parsed<T> = { value: T; problems: number };

export function parseProgressMap(raw: string | null): Parsed<Record<string, ExerciseProgress>> {
  if (!raw) return { value: {}, problems: 0 };

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { value: {}, problems: 1 };
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) return { value: {}, problems: 1 };

  const value: Record<string, ExerciseProgress> = {};
  let problems = 0;
  for (const [id, entry] of Object.entries(json)) {
    const parsed = ExerciseProgressSchema.safeParse(entry);
    if (parsed.success && parsed.data.exerciseId === id) value[id] = parsed.data;
    else problems++;
  }
  return { value, problems };
}

export function parseAttempts(raw: string | null): Parsed<Attempt[]> {
  if (!raw) return { value: [], problems: 0 };

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { value: [], problems: 1 };
  }
  if (!Array.isArray(json)) return { value: [], problems: 1 };

  const value: Attempt[] = [];
  let problems = 0;
  for (const entry of json) {
    const parsed = AttemptSchema.safeParse(entry);
    if (parsed.success) value.push(parsed.data);
    else problems++;
  }
  return { value, problems };
}
