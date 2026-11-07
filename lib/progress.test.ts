import { describe, expect, it } from "vitest";
import { applyAttempt, capAttempts, mergeProgress, newProgress } from "./progress";
import type { Attempt, ExerciseProgress } from "@/types/progress";

const at = (n: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString();

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  exerciseId: "sum-01",
  kind: "submit",
  passed: true,
  durationMs: 60_000,
  code: "x",
  createdAt: at(1),
  ...over,
});

describe("applyAttempt", () => {
  it("uspešan Submit rešava zadatak, beleži vreme i najbolje vreme", () => {
    const p = applyAttempt(null, attempt());
    expect(p).toMatchObject({ status: "solved", solvedAt: at(1), bestTimeMs: 60_000, updatedAt: at(1) });
  });

  it("neuspešan Submit i Run ne rešavaju zadatak", () => {
    expect(applyAttempt(null, attempt({ passed: false })).status).toBe("in_progress");
    expect(applyAttempt(null, attempt({ kind: "run", passed: true })).status).toBe("in_progress");
    expect(applyAttempt(null, attempt({ kind: "run", passed: true })).solvedAt).toBeUndefined();
  });

  it("kasniji neuspešni pokušaji ne poništavaju rešenje, a solvedAt ostaje prvi put", () => {
    const solved = applyAttempt(null, attempt({ createdAt: at(1) }));
    const later = applyAttempt(solved, attempt({ passed: false, createdAt: at(9) }));
    expect(later.status).toBe("solved");
    expect(later.solvedAt).toBe(at(1));
    expect(later.updatedAt).toBe(at(9));
  });

  it("bestTimeMs se menja samo kad je novo vreme kraće", () => {
    const first = applyAttempt(null, attempt({ durationMs: 50_000, createdAt: at(1) }));
    const slower = applyAttempt(first, attempt({ durationMs: 90_000, createdAt: at(2) }));
    const faster = applyAttempt(slower, attempt({ durationMs: 20_000, createdAt: at(3) }));
    expect(slower.bestTimeMs).toBe(50_000);
    expect(faster.bestTimeMs).toBe(20_000);
  });

  it("rešenje uz treći nivo pomoći je solved_with_help", () => {
    const helped: ExerciseProgress = { ...newProgress("sum-01", at(0)), hintLevel: 3 };
    expect(applyAttempt(helped, attempt()).status).toBe("solved_with_help");
  });

  it("ne menja ulazni objekat", () => {
    const prev = newProgress("sum-01", at(0));
    applyAttempt(prev, attempt());
    expect(prev.status).toBe("in_progress");
  });
});

describe("capAttempts", () => {
  it("zadržava poslednjih N po zadatku, nezavisno za svaki zadatak", () => {
    const list: Attempt[] = [
      ...Array.from({ length: 25 }, (_, i) => attempt({ exerciseId: "a", createdAt: at(i), code: `a${i}` })),
      ...Array.from({ length: 3 }, (_, i) => attempt({ exerciseId: "b", createdAt: at(100 + i), code: `b${i}` })),
    ];
    const capped = capAttempts(list, 20);
    expect(capped.filter((x) => x.exerciseId === "a")).toHaveLength(20);
    expect(capped.filter((x) => x.exerciseId === "b")).toHaveLength(3);
    expect(capped.find((x) => x.exerciseId === "a")?.code).toBe("a5"); // najstarijih 5 je izbačeno
  });
});

describe("mergeProgress", () => {
  const prog = (id: string, updatedAt: string, status: ExerciseProgress["status"] = "in_progress"): ExerciseProgress => ({
    ...newProgress(id, updatedAt),
    status,
  });

  it("za isti zadatak pobeđuje noviji updatedAt, u oba smera", () => {
    const older = prog("a", at(1));
    const newer = prog("a", at(5), "solved");
    expect(mergeProgress({ progress: [older], attempts: [] }, { progress: [newer], attempts: [] }).progress[0].status).toBe("solved");
    expect(mergeProgress({ progress: [newer], attempts: [] }, { progress: [older], attempts: [] }).progress[0].status).toBe("solved");
  });

  it("zadržava zadatke koji postoje samo na jednoj strani", () => {
    const merged = mergeProgress({ progress: [prog("a", at(1))], attempts: [] }, { progress: [prog("b", at(2))], attempts: [] });
    expect(merged.progress.map((p) => p.exerciseId).sort()).toEqual(["a", "b"]);
  });

  it("pokušaji se spajaju bez duplikata i sortiraju po vremenu", () => {
    const a1 = attempt({ createdAt: at(1) });
    const a2 = attempt({ createdAt: at(2) });
    const a3 = attempt({ createdAt: at(3) });
    const merged = mergeProgress({ progress: [], attempts: [a2, a3] }, { progress: [], attempts: [a1, a2] });
    expect(merged.attempts.map((a) => a.createdAt)).toEqual([at(1), at(2), at(3)]);
  });
});
