import { describe, expect, it } from "vitest";
import {
  availableTags,
  barSegments,
  availableTypes,
  countSolved,
  filterItems,
  levelStats,
  percent,
  recentActivity,
  solvedSets,
  type BrowseItem,
} from "./browse";
import { newProgress } from "./progress";
import { isPlayable, SUPPORTED_RUNTIMES } from "./runner/runtimes";
import type { ExerciseProgress } from "@/types/progress";
import { getExercises } from "./content";

const item = (over: Partial<BrowseItem> & { id: string }): BrowseItem => ({
  title: over.id,
  area: "javascript",
  level: "pocetnik",
  type: "classic",
  tags: [],
  playable: true,
  ...over,
});

const items: BrowseItem[] = [
  item({ id: "a", tags: ["closures", "functions"] }),
  item({ id: "b", level: "srednji", tags: ["async"] }),
  item({ id: "c", area: "typescript", tags: ["generics"] }),
  item({ id: "d", area: "typescript", level: "srednji", type: "bug-hunt", tags: ["async", "generics"] }),
];

describe("filterItems", () => {
  it("bez filtera vraća sve", () => {
    expect(filterItems(items, {})).toHaveLength(4);
  });

  it("filtrira po oblasti, nivou, tipu i tagu, i po njihovoj kombinaciji", () => {
    expect(filterItems(items, { area: "typescript" }).map((i) => i.id)).toEqual(["c", "d"]);
    expect(filterItems(items, { level: "srednji" }).map((i) => i.id)).toEqual(["b", "d"]);
    expect(filterItems(items, { type: "bug-hunt" }).map((i) => i.id)).toEqual(["d"]);
    expect(filterItems(items, { tag: "async" }).map((i) => i.id)).toEqual(["b", "d"]);
    expect(filterItems(items, { area: "typescript", level: "srednji", tag: "generics" }).map((i) => i.id)).toEqual(["d"]);
  });

  it("kombinacija bez rezultata daje prazan niz", () => {
    expect(filterItems(items, { area: "node" })).toEqual([]);
  });
});

describe("statistika", () => {
  const solved = new Set(["a", "c", "nepostojeci"]);

  it("countSolved broji samo rešene zadatke koji postoje u listi", () => {
    expect(countSolved(items, solved)).toEqual({ solved: 2, helped: 0, total: 4 });
    expect(countSolved([], solved)).toEqual({ solved: 0, helped: 0, total: 0 });
  });

  it("levelStats daje brojeve za svaku oblast i nivo, i prazne ćelije", () => {
    const stats = levelStats(items, solved);
    expect(stats.javascript.pocetnik).toEqual({ solved: 1, helped: 0, total: 1 });
    expect(stats.javascript.srednji).toEqual({ solved: 0, helped: 0, total: 1 });
    expect(stats.javascript.expert).toEqual({ solved: 0, helped: 0, total: 0 });
    expect(stats.typescript.pocetnik).toEqual({ solved: 1, helped: 0, total: 1 });
    expect(stats["react-next"].pocetnik).toEqual({ solved: 0, helped: 0, total: 0 });
  });

  it("solvedSets razdvaja rešeno samostalno od rešenog uz pomoć, a nerešeno ne broji", () => {
    const base = newProgress("x", "2026-01-01T00:00:00.000Z");
    const { solvedIds, helpedIds } = solvedSets({
      a: { ...base, exerciseId: "a", status: "solved" },
      b: { ...base, exerciseId: "b", status: "solved_with_help" },
      c: { ...base, exerciseId: "c", status: "in_progress" },
    });
    expect([...solvedIds].sort()).toEqual(["a", "b"]);
    expect([...helpedIds]).toEqual(["b"]);
  });

  it("countSolved broji uz pomoć posebno, ali ih uključuje u rešene", () => {
    expect(countSolved(items, new Set(["a", "c"]), new Set(["c"]))).toEqual({ solved: 2, helped: 1, total: 4 });
  });

  it("barSegments daje zeleni i narandžasti deo trake koji zajedno daju rešene", () => {
    expect(barSegments({ solved: 3, helped: 1, total: 4 })).toEqual({ solo: 50, helped: 25 });
    expect(barSegments({ solved: 0, helped: 0, total: 0 })).toEqual({ solo: 0, helped: 0 });
  });

  it("percent ne deli nulom i zaokružuje", () => {
    expect(percent({ solved: 0, total: 0 })).toBe(0);
    expect(percent({ solved: 1, total: 3 })).toBe(33);
    expect(percent({ solved: 3, total: 3 })).toBe(100);
  });
});

describe("recentActivity", () => {
  const prog = (exerciseId: string, updatedAt: string): ExerciseProgress => ({
    ...newProgress(exerciseId, updatedAt),
    updatedAt,
  });
  const at = (n: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString();

  it("vraća zadatke od najnovijeg i poštuje ograničenje", () => {
    const progress = { a: prog("a", at(1)), b: prog("b", at(9)), c: prog("c", at(5)) };
    expect(recentActivity(items, progress).map((r) => r.item.id)).toEqual(["b", "c", "a"]);
    expect(recentActivity(items, progress, 2).map((r) => r.item.id)).toEqual(["b", "c"]);
  });

  it("preskače zapise o zadacima koji više ne postoje i radi bez aktivnosti", () => {
    expect(recentActivity(items, { gone: prog("gone", at(1)) })).toEqual([]);
    expect(recentActivity(items, {})).toEqual([]);
  });
});

describe("dostupne opcije filtera", () => {
  it("tipovi i tagovi su jedinstveni i sortirani", () => {
    expect(availableTypes(items)).toEqual(["bug-hunt", "classic"]);
    expect(availableTags(items)).toEqual(["async", "closures", "functions", "generics"]);
  });
});

describe("isPlayable", () => {
  it("radni ekran postoji samo za klasične zadatke sa podržanim okruženjem", () => {
    expect(isPlayable({ type: "classic", runtime: "worker" })).toBe(true);
    expect(isPlayable({ type: "classic", runtime: "types" })).toBe(true);
    expect(isPlayable({ type: "classic", runtime: "iframe-react" })).toBe(false);
    expect(isPlayable({ type: "bug-hunt", runtime: "worker" })).toBe(false);
    expect(SUPPORTED_RUNTIMES).toEqual(["worker", "worker-ts", "types"]);
  });
});

describe("sadržaj", () => {
  it("JavaScript ima 15 zadataka (10 početnih, 4 srednja, 1 expert), a svi zadaci su rešivi u ovom trenutku", () => {
    const all = getExercises();
    const js = getExercises({ area: "javascript" });
    expect(js).toHaveLength(15);
    expect(getExercises({ area: "javascript", level: "pocetnik" })).toHaveLength(10);
    expect(getExercises({ area: "javascript", level: "srednji" })).toHaveLength(4);
    expect(getExercises({ area: "javascript", level: "expert" })).toHaveLength(1);
    expect(all.every((e) => isPlayable(e))).toBe(true);
    const cells = new Set(all.map((e) => `${e.area}/${e.level}`));
    for (const cell of ["javascript/pocetnik", "javascript/srednji", "javascript/expert", "typescript/pocetnik", "typescript/srednji", "node/pocetnik", "node/srednji"]) {
      expect(cells.has(cell), cell).toBe(true);
    }
  });
});
