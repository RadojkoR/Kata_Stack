import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createTsChecker, createInProcessWorker, createNodeWorker } from "../testing";
import { allPassed } from "../types";
import { createTypesRunner } from "./types-only";
import { createWorkerRunner } from "./worker";
import { createWorkerTsRunner } from "./worker-ts";

describe("adapter worker", () => {
  const runner = createWorkerRunner(createInProcessWorker);

  it("vraća rezultate testova, logove i trajanje", async () => {
    const r = await runner.run({
      code: "function dbl(n) { console.log('dbl', n); return n * 2; }",
      tests: "test('udvostručuje', () => { expect(dbl(4)).toBe(8); });",
    });
    expect(r.tests).toEqual([{ name: "udvostručuje", passed: true }]);
    expect(r.logs).toEqual([{ level: "log", text: "dbl 4" }]);
    expect(r.timedOut).toBe(false);
    expect(r.error).toBeUndefined();
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
    expect(allPassed(r)).toBe(true);
  });

  it("allPassed je false kad test pada, kad ima greške i kad nema testova", async () => {
    const failing = await runner.run({ code: "", tests: "test('x', () => { expect(1).toBe(2); });" });
    expect(allPassed(failing)).toBe(false);

    const broken = await runner.run({ code: "function (", tests: "test('x', () => {});" });
    expect(broken.error).toMatchObject({ code: "exception" });
    expect(allPassed(broken)).toBe(false);

    const empty = await runner.run({ code: "", tests: "" });
    expect(allPassed(empty)).toBe(false);
  });

  it("prekida beskonačnu petlju posle timeout-a i zadržava ono što je do tada stiglo", async () => {
    const looping = createWorkerRunner(
      createNodeWorker(fileURLToPath(new URL("../__fixtures__/loop-worker.mjs", import.meta.url))),
    );
    const started = Date.now();
    const r = await looping.run({ code: "while (true) {}", tests: "", timeoutMs: 300 });

    expect(r.timedOut).toBe(true);
    expect(r.error).toEqual({ code: "timeout", ms: 300 });
    expect(r.logs).toEqual([{ level: "log", text: "pre petlje" }]);
    expect(Date.now() - started).toBeLessThan(2500);
  });

  it("javlja grešku kad Worker ne može da se pokrene", async () => {
    const broken = createWorkerRunner(() => {
      throw new Error("nema workera");
    });
    const r = await broken.run({ code: "", tests: "" });
    expect(r.error).toEqual({ code: "worker", message: "nema workera" });
  });
});

describe("adapter worker-ts", () => {
  const runner = createWorkerTsRunner(createInProcessWorker, createTsChecker());

  it("prevodi TypeScript i izvršava testove", async () => {
    const r = await runner.run({
      code: "function greet(name: string): string { return `Hi ${name}`; }",
      tests: "test('pozdravlja', () => { const s: string = greet('Ana'); expect(s).toBe('Hi Ana'); });",
    });
    expect(r.error).toBeUndefined();
    expect(allPassed(r)).toBe(true);
    expect(r.typeErrors).toEqual([]);
  });

  it("greške tipova se prijavljuju, ali ne obaraju testove", async () => {
    const r = await runner.run({
      code: "function f(n: number): number { return n; }\nconst s: string = f(1);",
      tests: "test('radi', () => { expect(f(2)).toBe(2); });",
    });
    expect(allPassed(r)).toBe(true);
    expect(r.typeErrors).toHaveLength(1);
    expect(r.typeErrors?.[0].line).toBe(2);
  });

  it("sintaksna greška u TS-u daje grešku prevođenja", async () => {
    const r = await runner.run({ code: "function (", tests: "" });
    expect(r.error?.code).toBe("transpile");
  });
});

describe("adapter types", () => {
  const runner = createTypesRunner(createTsChecker());

  const solution = "type Pick2<T, K extends keyof T> = { [P in K]: T[P] };";
  const tests = [
    "type User = { id: number; name: string };",
    "type Case1 = Expect<Equal<Pick2<User, 'id'>, { id: number }>>;",
    "type Case2 = Expect<Equal<Pick2<User, 'name'>, { name: string }>>;",
  ].join("\n");

  it("sve Expect provere prolaze za ispravno rešenje", async () => {
    const r = await runner.run({ code: solution, tests });
    expect(r.error).toBeUndefined();
    expect(r.tests).toHaveLength(3); // provera koda + 2 Expect linije
    expect(r.tests.every((t) => t.passed)).toBe(true);
    expect(allPassed(r)).toBe(true);
  });

  it("pogrešno rešenje obara samo Expect linije koje ne prolaze", async () => {
    const r = await runner.run({
      code: "type Pick2<T, K extends keyof T> = { id: number };",
      tests,
    });
    const byName = Object.fromEntries(r.tests.map((t) => [String(t.name), t.passed]));
    expect(byName["type Case1 = Expect<Equal<Pick2<User, 'id'>, { id: number }>>;"]).toBe(true);
    expect(byName["type Case2 = Expect<Equal<Pick2<User, 'name'>, { name: string }>>;"]).toBe(false);
    expect(allPassed(r)).toBe(false);
  });

  it("greške tipova u korisničkom kodu se prijavljuju sa brojem linije iz editora", async () => {
    const r = await runner.run({ code: "type A = 1;\ntype B = NepostojeciTip;", tests: "" });
    expect(r.typeErrors).toHaveLength(1);
    expect(r.typeErrors?.[0].line).toBe(2);
    expect(r.tests[0].passed).toBe(false);
  });

  it("skriveni Expect testovi ne otkrivaju sadržaj", async () => {
    const r = await runner.run({
      code: "type Id<T> = T;",
      tests: "type Ok = Expect<Equal<Id<1>, 1>>;",
      hiddenTests: "type Tajna = Expect<Equal<Id<2>, 3>>;",
    });
    const hidden = r.tests.find((t) => t.hidden);
    expect(hidden).toEqual({ name: "", hidden: true, hiddenIndex: 1, passed: false });
  });
});
