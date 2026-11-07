import { describe, expect, it } from "vitest";
import { executeTests, MAX_LOGS, type ExecInput, type OutMessage } from "./execute";
import type { LogEntry, TestResult } from "./types";

async function exec(input: ExecInput) {
  const messages: OutMessage[] = [];
  await executeTests(input, (m) => messages.push(m));
  const tests = messages.flatMap((m) => (m.type === "test" ? [m.test] : [])) as TestResult[];
  const logs = messages.flatMap((m) => (m.type === "log" ? [m.log] : [])) as LogEntry[];
  const done = messages.at(-1);
  return { tests, logs, error: done?.type === "done" ? done.error : "nema done poruke" };
}

describe("executeTests", () => {
  it("izvršava testove nad korisničkim kodom", async () => {
    const r = await exec({
      code: "function add(a, b) { return a + b; }",
      tests: "test('sabira', () => { expect(add(2, 3)).toBe(5); });",
    });
    expect(r.error).toBeUndefined();
    expect(r.tests).toEqual([{ name: "sabira", passed: true }]);
  });

  it("javlja očekivanu i dobijenu vrednost kad test padne", async () => {
    const r = await exec({
      code: "function add(a, b) { return a - b; }",
      tests: "test('sabira', () => { expect(add(2, 3)).toBe(5); });",
    });
    expect(r.tests[0]).toMatchObject({
      passed: false,
      failure: { code: "mismatch", matcher: "toBe" },
      expected: "5",
      actual: "-1",
    });
  });

  it("izuzetak u testu mimo expect-a daje izvornu poruku", async () => {
    const r = await exec({ code: "", tests: "test('x', () => { null.foo; });" });
    expect(r.tests[0].passed).toBe(false);
    expect(r.tests[0].error).toMatch(/^TypeError:/);
    expect(r.tests[0].failure).toBeUndefined();
  });

  it("podržava async testove i resolves", async () => {
    const r = await exec({
      code: "const wait = (v) => new Promise((res) => setTimeout(() => res(v), 5));",
      tests: `
        test('await', async () => { expect(await wait(1)).toBe(1); });
        test('resolves', async () => { await expect(wait(2)).resolves.toBe(2); });
      `,
    });
    expect(r.tests.map((t) => t.passed)).toEqual([true, true]);
  });

  it("presreće console.* uz nivoe", async () => {
    const r = await exec({
      code: "console.log('a', 1); console.warn('b'); console.error({ c: 2 }); console.info('d');",
      tests: "",
    });
    expect(r.logs).toEqual([
      { level: "log", text: "a 1" },
      { level: "warn", text: "b" },
      { level: "error", text: "{ c: 2 }" },
      { level: "log", text: "d" },
    ]);
  });

  it("ograničava broj ispisa", async () => {
    const r = await exec({ code: "for (let i = 0; i < 1000; i++) console.log(i);", tests: "" });
    expect(r.logs).toHaveLength(MAX_LOGS + 1);
    expect(r.logs.at(-1)?.level).toBe("warn");
  });

  it("sintaksna greška u kodu se javlja kao greška, bez testova", async () => {
    const r = await exec({ code: "function (", tests: "test('x', () => {});" });
    expect(r.error).toMatch(/SyntaxError/);
    expect(r.tests).toEqual([]);
  });

  it("izuzetak pri učitavanju koda se javlja kao greška", async () => {
    const r = await exec({ code: "undefinedFunction();", tests: "test('x', () => {});" });
    expect(r.error).toMatch(/ReferenceError/);
  });

  it("strogi režim: dodela nedeklarisanoj promenljivoj je greška", async () => {
    const r = await exec({ code: "x = 5;", tests: "" });
    expect(r.error).toMatch(/ReferenceError/);
  });

  it("test() prihvata ime kao { sr, en }, a odbija nevažeće argumente", async () => {
    const ok = await exec({ code: "", tests: "test({ sr: 'zdravo', en: 'hello' }, () => {});" });
    expect(ok.tests[0].name).toEqual({ sr: "zdravo", en: "hello" });

    const bad = await exec({ code: "", tests: "test(5, () => {});" });
    expect(bad.error).toMatch(/TypeError/);
  });

  describe("skriveni testovi", () => {
    const code = "function add(a, b) { return a + b; }";
    const tests = "test('vidljiv', () => { expect(add(1, 1)).toBe(2); });";

    it("ne otkrivaju ime ni vrednosti", async () => {
      const r = await exec({
        code,
        tests,
        hiddenTests: "test('tajni naziv', () => { expect(add(1, 1)).toBe(999); });",
      });
      expect(r.tests).toHaveLength(2);
      expect(r.tests[1]).toEqual({ name: "", hidden: true, hiddenIndex: 1, passed: false });
      expect(JSON.stringify(r.tests[1])).not.toMatch(/tajni|999/);
    });

    it("prolaze kad je kod ispravan, a bez hiddenTests ih nema", async () => {
      const withHidden = await exec({
        code,
        tests,
        hiddenTests: "test('a', () => { expect(add(2, 2)).toBe(4); });",
      });
      expect(withHidden.tests.map((t) => t.passed)).toEqual([true, true]);

      const without = await exec({ code, tests });
      expect(without.tests).toHaveLength(1);
    });
  });
});
