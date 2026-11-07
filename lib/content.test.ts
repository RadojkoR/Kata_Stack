import { describe, expect, it } from "vitest";
import { getExercises } from "./content";
import { getRunner } from "./runner";
import { allPassed } from "./runner/types";
import { createInProcessWorker, createTsChecker } from "./runner/testing";

/**
 * Svaki zadatak mora biti rešiv: sva njegova rešenja prolaze vidljive i skrivene testove,
 * a početni kod ne sme da prođe (inače zadatak nema smisla).
 */
const deps = { createWorker: createInProcessWorker, typeCheck: createTsChecker() };

describe.each(getExercises().filter((e) => e.type === "classic" && ["worker", "worker-ts", "types"].includes(e.runtime)))(
  "zadatak $id",
  (exercise) => {
    if (exercise.type !== "classic") return;
    const runner = getRunner(exercise.runtime, deps);

    it.each(exercise.solutions.map((s) => [s.label, s.code] as const))("rešenje '%s' prolazi sve testove", async (_label, code) => {
      const r = await runner.run({ code, tests: exercise.tests, hiddenTests: exercise.hiddenTests });
      expect(r.error).toBeUndefined();
      expect(r.tests.filter((t) => !t.passed)).toEqual([]);
      expect(allPassed(r)).toBe(true);
    });

    it("početni kod ne prolazi testove", async () => {
      const r = await runner.run({ code: exercise.starterCode, tests: exercise.tests, hiddenTests: exercise.hiddenTests });
      expect(allPassed(r)).toBe(false);
    });
  },
);
