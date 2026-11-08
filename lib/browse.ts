import type { Locale } from "@/i18n/config";
import { localize } from "@/i18n/localized";
import type { Area, Exercise, ExerciseType, Level } from "@/types/exercise";
import type { ExerciseProgress } from "@/types/progress";
import { AREAS, LEVELS } from "@/types/exercise";
import { isPlayable } from "./runner/runtimes";

/** Logika početnog ekrana: filtriranje liste i brojanje rešenih zadataka po oblasti i nivou. */

export type BrowseItem = {
  id: string;
  title: string;
  area: Area;
  level: Level;
  type: ExerciseType;
  tags: string[];
  /** Postoji li radni ekran za ovaj zadatak. */
  playable: boolean;
};

export function toBrowseItem(exercise: Exercise, locale: Locale): BrowseItem {
  return {
    id: exercise.id,
    title: localize(exercise.title, locale),
    area: exercise.area,
    level: exercise.level,
    type: exercise.type,
    tags: exercise.tags,
    playable: isPlayable(exercise),
  };
}

export type Filter = {
  area?: Area;
  level?: Level;
  type?: ExerciseType;
  tag?: string;
};

/** Oblasti čije okruženje još nije gotovo. Prikazuju se kao "uskoro" (React pre Faze 3). */
export const COMING_SOON_AREAS: readonly Area[] = ["react-next"];

export function filterItems(items: BrowseItem[], filter: Filter): BrowseItem[] {
  return items.filter(
    (i) =>
      (!filter.area || i.area === filter.area) &&
      (!filter.level || i.level === filter.level) &&
      (!filter.type || i.type === filter.type) &&
      (!filter.tag || i.tags.includes(filter.tag)),
  );
}

/** `solved` uključuje i zadatke rešene uz pomoć; `helped` je samo njihov broj (prikazuju se drugom bojom). */
export type Stats = { solved: number; helped: number; total: number };

/** Rešeni zadaci iz napretka: svi rešeni, i među njima oni rešeni uz pomoć. */
export function solvedSets(progress: Record<string, ExerciseProgress>): {
  solvedIds: Set<string>;
  helpedIds: Set<string>;
} {
  const solvedIds = new Set<string>();
  const helpedIds = new Set<string>();
  for (const p of Object.values(progress)) {
    if (p.status === "in_progress") continue;
    solvedIds.add(p.exerciseId);
    if (p.status === "solved_with_help") helpedIds.add(p.exerciseId);
  }
  return { solvedIds, helpedIds };
}

export function countSolved(
  items: BrowseItem[],
  solvedIds: ReadonlySet<string>,
  helpedIds: ReadonlySet<string> = new Set(),
): Stats {
  return {
    solved: items.filter((i) => solvedIds.has(i.id)).length,
    helped: items.filter((i) => solvedIds.has(i.id) && helpedIds.has(i.id)).length,
    total: items.length,
  };
}

/** Brojevi za svaku oblast i nivo, uključujući prazne ćelije (0 od 0). */
export function levelStats(
  items: BrowseItem[],
  solvedIds: ReadonlySet<string>,
  helpedIds: ReadonlySet<string> = new Set(),
): Record<Area, Record<Level, Stats>> {
  const result = {} as Record<Area, Record<Level, Stats>>;
  for (const area of AREAS) {
    result[area] = {} as Record<Level, Stats>;
    for (const level of LEVELS) {
      result[area][level] = countSolved(
        items.filter((i) => i.area === area && i.level === level),
        solvedIds,
        helpedIds,
      );
    }
  }
  return result;
}

export function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

/** Tipovi i tagovi koji postoje u zadacima, da filter ne nudi opciju koja daje prazan rezultat. */
export function availableTypes(items: BrowseItem[]): ExerciseType[] {
  return uniqueSorted(items.map((i) => i.type));
}

export function availableTags(items: BrowseItem[]): string[] {
  return uniqueSorted(items.flatMap((i) => i.tags));
}

export type RecentEntry = { item: BrowseItem; progress: ExerciseProgress };

/** Poslednje korišćeni zadaci (pokušaj ili beleška), od najnovijeg. Zapisi o nepostojećim zadacima se preskaču. */
export function recentActivity(
  items: BrowseItem[],
  progress: Record<string, ExerciseProgress>,
  limit = 5,
): RecentEntry[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return Object.values(progress)
    .flatMap((p) => {
      const item = byId.get(p.exerciseId);
      return item ? [{ item, progress: p }] : [];
    })
    .sort((a, b) => b.progress.updatedAt.localeCompare(a.progress.updatedAt))
    .slice(0, limit);
}

export function percent({ solved, total }: Pick<Stats, "solved" | "total">): number {
  return total === 0 ? 0 : Math.round((solved / total) * 100);
}

/** Širina zelenog (samostalno rešeno) i narandžastog (uz pomoć) dela trake, u procentima. */
export function barSegments({ solved, helped, total }: Stats): { solo: number; helped: number } {
  if (total === 0) return { solo: 0, helped: 0 };
  return { solo: ((solved - helped) / total) * 100, helped: (helped / total) * 100 };
}
