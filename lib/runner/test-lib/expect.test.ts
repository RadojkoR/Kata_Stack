import { describe, expect, it } from "vitest";
import { deepEqual } from "./equal";
import { AssertionError, createExpect } from "./expect";
import { formatLogArgs, formatValue } from "./format";

const ex = createExpect();

function fail(fn: () => unknown): AssertionError {
  try {
    fn();
  } catch (e) {
    if (e instanceof AssertionError) return e;
    throw e;
  }
  throw new Error("očekivan je AssertionError, ali ništa nije bačeno");
}

describe("deepEqual", () => {
  it("poredi primitive, nizove i objekte", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual([1, [2]], [1, [2]])).toBe(true);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("razlikuje niz i objekat, 0 i -0, ali NaN je jednak NaN", () => {
    expect(deepEqual([], {})).toBe(false);
    expect(deepEqual(0, -0)).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
  });

  it("ignoriše svojstva sa vrednošću undefined (kao toEqual u Jest-u)", () => {
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
  });

  it("radi sa Date, Set, Map i kružnim referencama", () => {
    expect(deepEqual(new Date(5), new Date(5))).toBe(true);
    expect(deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(deepEqual(new Map([[1, "a"]]), new Map([[1, "a"]]))).toBe(true);
    expect(deepEqual(new Map([[1, "a"]]), new Map([[1, "b"]]))).toBe(false);
    const a: Record<string, unknown> = {};
    a.self = a;
    const b: Record<string, unknown> = {};
    b.self = b;
    expect(deepEqual(a, b)).toBe(true);
  });
});

describe("formatValue", () => {
  it("prikazuje vrednosti čitljivo", () => {
    expect(formatValue("a")).toBe('"a"');
    expect(formatValue([1, "x", null, undefined])).toBe('[1, "x", null, undefined]');
    expect(formatValue({ a: 1, b: [2] })).toBe("{ a: 1, b: [2] }");
    expect(formatValue(-0)).toBe("-0");
    expect(formatValue(function foo() {})).toBe("[Function foo]");
  });

  it("ne puca na kružnoj strukturi i skraćuje dugačak izlaz", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(formatValue(a)).toBe("{ self: [Circular] }");
    expect(formatValue("x".repeat(1000)).length).toBeLessThan(400);
  });

  it("formatLogArgs ostavlja stringove bez navodnika", () => {
    expect(formatLogArgs(["a", 1, { b: 2 }])).toBe("a 1 { b: 2 }");
  });
});

describe("expect", () => {
  it("toBe prolazi i pada sa očekivanom i dobijenom vrednošću", () => {
    expect(() => ex(5).toBe(5)).not.toThrow();
    const e = fail(() => ex(4).toBe(5));
    expect(e).toMatchObject({ code: "mismatch", matcher: "toBe", expected: "5", actual: "4" });
  });

  it("toEqual poredi duboko", () => {
    expect(() => ex({ a: [1] }).toEqual({ a: [1] })).not.toThrow();
    expect(fail(() => ex({ a: [1] }).toEqual({ a: [2] })).code).toBe("mismatch");
  });

  it(".not obrće proveru i javlja kod 'negated'", () => {
    expect(() => ex(1).not.toBe(2)).not.toThrow();
    expect(fail(() => ex(1).not.toBe(1)).code).toBe("negated");
  });

  it("toBeTruthy, toBeFalsy, toContain, toHaveLength", () => {
    expect(() => ex(1).toBeTruthy()).not.toThrow();
    expect(() => ex("").toBeFalsy()).not.toThrow();
    expect(() => ex([1, 2]).toContain(2)).not.toThrow();
    expect(() => ex("abc").toContain("b")).not.toThrow();
    expect(() => ex([1, 2]).toHaveLength(2)).not.toThrow();
    expect(fail(() => ex([1]).toContain(2)).matcher).toBe("toContain");
    expect(fail(() => ex([1]).toHaveLength(2)).actual).toBe("1");
  });

  it("toThrow proverava poruku, RegExp i klasu greške", () => {
    const boom = () => {
      throw new TypeError("loše");
    };
    expect(() => ex(boom).toThrow()).not.toThrow();
    expect(() => ex(boom).toThrow("loš")).not.toThrow();
    expect(() => ex(boom).toThrow(/loše/)).not.toThrow();
    expect(() => ex(boom).toThrow(TypeError)).not.toThrow();
    expect(fail(() => ex(boom).toThrow(RangeError)).code).toBe("mismatch");
    expect(fail(() => ex(() => 1).toThrow()).code).toBe("not-thrown");
    expect(() => ex(() => 1).not.toThrow()).not.toThrow();
  });

  it("toThrow zahteva funkciju u expect-u", () => {
    expect(() => ex(5).toThrow()).toThrow(/must be a function/);
  });

  it("resolves i rejects vraćaju Promise koji treba sačekati", async () => {
    await expect(ex(Promise.resolve(3)).resolves.toBe(3)).resolves.toBeUndefined();
    await expect(ex(Promise.resolve(3)).resolves.toBe(4)).rejects.toMatchObject({ code: "mismatch" });
    await expect(ex(Promise.reject(new Error("x"))).resolves.toBe(1)).rejects.toMatchObject({
      code: "rejected-unexpectedly",
    });
    await expect(ex(Promise.resolve(1)).rejects.toThrow()).rejects.toMatchObject({
      code: "resolved-unexpectedly",
    });
    await expect(ex(Promise.reject(new Error("greška"))).rejects.toThrow("greška")).resolves.toBeUndefined();
  });
});
