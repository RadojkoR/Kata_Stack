import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en.json";
import sr from "@/i18n/dictionaries/sr.json";
import { failureMessage, interpolate, runErrorMessage, testTitle } from "./messages";
import type { TestResult } from "./types";

describe("interpolate", () => {
  it("zamenjuje promenljive, a nepoznate ostavlja praznim", () => {
    expect(interpolate("Prošlo {a} od {b}", { a: 2, b: 3 })).toBe("Prošlo 2 od 3");
    expect(interpolate("x {nema} y", {})).toBe("x  y");
  });
});

describe("testTitle", () => {
  it("bira jezik iz imena testa", () => {
    const t: TestResult = { name: { sr: "zdravo", en: "hello" }, passed: true };
    expect(testTitle(t, "sr", sr.runner)).toBe("zdravo");
    expect(testTitle(t, "en", en.runner)).toBe("hello");
  });

  it("običan string ostaje isti, a skriveni test se prikazuje samo brojem", () => {
    expect(testTitle({ name: "plain", passed: true }, "en", en.runner)).toBe("plain");
    expect(testTitle({ name: "", hidden: true, hiddenIndex: 2, passed: false }, "sr", sr.runner)).toBe("Skriveni test 2");
    expect(testTitle({ name: "", hidden: true, hiddenIndex: 2, passed: false }, "en", en.runner)).toBe("Hidden test 2");
  });
});

describe("failureMessage", () => {
  const mismatch: TestResult = {
    name: "x",
    passed: false,
    failure: { code: "mismatch", matcher: "toBe" },
    expected: "5",
    actual: "4",
  };

  it("prevodi grešku poređenja na oba jezika", () => {
    expect(failureMessage(mismatch, sr.runner)).toBe("Očekivano 5, dobijeno 4");
    expect(failureMessage(mismatch, en.runner)).toBe("Expected 5, received 4");
  });

  it("pokriva sve kodove grešaka", () => {
    for (const code of ["mismatch", "negated", "not-thrown", "resolved-unexpectedly", "rejected-unexpectedly"] as const) {
      const msg = failureMessage(
        { name: "x", passed: false, failure: { code, matcher: "m" }, expected: "e", actual: "a" },
        en.runner,
      );
      expect(msg, code).toBeTruthy();
      expect(msg, code).not.toMatch(/\{\w+\}/);
    }
  });

  it("izuzetak iz testa se prikazuje kakav jeste, a prošao ili skriveni test nema poruku", () => {
    expect(failureMessage({ name: "x", passed: false, error: "TypeError: boom" }, en.runner)).toBe("TypeError: boom");
    expect(failureMessage({ name: "x", passed: true }, en.runner)).toBeUndefined();
    expect(failureMessage({ name: "", hidden: true, hiddenIndex: 1, passed: false }, en.runner)).toBeUndefined();
  });
});

describe("runErrorMessage", () => {
  it("prevodi sve vrste grešaka", () => {
    expect(runErrorMessage({ code: "timeout", ms: 3000 }, sr.runner)).toContain("3000");
    expect(runErrorMessage({ code: "timeout", ms: 3000 }, en.runner)).toContain("infinite loop");
    expect(runErrorMessage({ code: "exception", message: "ReferenceError: x" }, en.runner)).toBe(
      "Runtime error: ReferenceError: x",
    );
    expect(runErrorMessage({ code: "transpile", message: "m" }, sr.runner)).toBe("Greška pri prevođenju: m");
    expect(runErrorMessage({ code: "worker", message: "m" }, en.runner)).toBe("Worker error: m");
  });
});
