import type { AssertionCode } from "../types";
import { deepEqual } from "./equal";
import { formatValue } from "./format";

export class AssertionError extends Error {
  constructor(
    readonly code: AssertionCode,
    readonly matcher: string,
    readonly expected?: string,
    readonly actual?: string,
  ) {
    super(`${matcher}: ${code}`);
    this.name = "AssertionError";
  }
}

interface Check {
  pass: boolean;
  expected?: string;
  actual?: string;
  /** Šta se prijavljuje kad provera padne (podrazumevano `mismatch`). */
  failCode?: AssertionCode;
}

type Thrown = { threw: boolean; error?: unknown };

function messageOf(e: unknown): string {
  return typeof e === "object" && e !== null && "message" in e ? String((e as { message: unknown }).message) : String(e);
}

function checkThrown(t: Thrown, arg: unknown): Check {
  const actual = t.threw ? formatValue(t.error) : undefined;
  const notThrown = (expected: string): Check => ({ pass: false, expected, actual, failCode: "not-thrown" });

  if (arg === undefined) {
    return t.threw ? { pass: true, expected: "toThrow()", actual } : notThrown("toThrow()");
  }

  const msg = messageOf(t.error);
  let pass: boolean;
  let expected: string;
  if (typeof arg === "string") {
    pass = t.threw && msg.includes(arg);
    expected = `toThrow(${formatValue(arg)})`;
  } else if (arg instanceof RegExp) {
    pass = t.threw && arg.test(msg);
    expected = `toThrow(${String(arg)})`;
  } else if (typeof arg === "function") {
    pass = t.threw && t.error instanceof (arg as new (...a: never[]) => unknown);
    expected = `toThrow(${(arg as { name?: string }).name || "?"})`;
  } else {
    throw new TypeError("toThrow accepts a string, a RegExp or an error class");
  }
  return t.threw ? { pass, expected, actual } : notThrown(expected);
}

const valueMatchers = {
  toBe: (received: unknown, expected: unknown): Check => ({
    pass: Object.is(received, expected),
    expected: formatValue(expected),
    actual: formatValue(received),
  }),
  toEqual: (received: unknown, expected: unknown): Check => ({
    pass: deepEqual(received, expected),
    expected: formatValue(expected),
    actual: formatValue(received),
  }),
  toBeTruthy: (received: unknown): Check => ({
    pass: Boolean(received),
    expected: "truthy",
    actual: formatValue(received),
  }),
  toBeFalsy: (received: unknown): Check => ({
    pass: !received,
    expected: "falsy",
    actual: formatValue(received),
  }),
  toContain: (received: unknown, item: unknown): Check => {
    let pass = false;
    if (typeof received === "string" && typeof item === "string") pass = received.includes(item);
    else if (Array.isArray(received)) pass = received.some((x) => Object.is(x, item));
    return { pass, expected: formatValue(item), actual: formatValue(received) };
  },
  toHaveLength: (received: unknown, length: unknown): Check => {
    const actual = (received as { length?: unknown } | null | undefined)?.length;
    return { pass: actual === length, expected: formatValue(length), actual: formatValue(actual) };
  },
};

type MatcherName = keyof typeof valueMatchers | "toThrow";
type Mode = "sync" | "resolves" | "rejects";

function settle(matcher: string, check: Check, not: boolean): void {
  if (check.pass === not) {
    throw new AssertionError(not ? "negated" : (check.failCode ?? "mismatch"), matcher, check.expected, check.actual);
  }
}

function runMatcher(name: MatcherName, received: unknown, args: unknown[], mode: Mode): Check {
  if (name === "toThrow") {
    if (mode === "rejects") return checkThrown({ threw: true, error: received }, args[0]);
    if (typeof received !== "function") {
      throw new TypeError("expect(fn).toThrow(): the argument of expect must be a function");
    }
    try {
      (received as () => unknown)();
      return checkThrown({ threw: false }, args[0]);
    } catch (error) {
      return checkThrown({ threw: true, error }, args[0]);
    }
  }
  return (valueMatchers[name] as (r: unknown, ...a: unknown[]) => Check)(received, ...args);
}

const NAMES: MatcherName[] = [...(Object.keys(valueMatchers) as MatcherName[]), "toThrow"];

function build(received: unknown, mode: Mode, not: boolean) {
  const api: Record<string, unknown> = {};

  for (const name of NAMES) {
    api[name] = (...args: unknown[]) => {
      if (mode === "sync") {
        settle(name, runMatcher(name, received, args, mode), not);
        return;
      }
      return Promise.resolve(received).then(
        (value) => {
          if (mode === "rejects") throw new AssertionError("resolved-unexpectedly", name, undefined, formatValue(value));
          settle(name, runMatcher(name, value, args, mode), not);
        },
        (reason) => {
          if (mode === "resolves") throw new AssertionError("rejected-unexpectedly", name, undefined, formatValue(reason));
          settle(name, runMatcher(name, reason, args, mode), not);
        },
      );
    };
  }

  if (!not) api.not = build(received, mode, true);
  if (mode === "sync" && !not) {
    api.resolves = build(received, "resolves", false);
    api.rejects = build(received, "rejects", false);
  }
  return api;
}

export interface Matchers<R> {
  toBe(expected: unknown): R;
  toEqual(expected: unknown): R;
  toBeTruthy(): R;
  toBeFalsy(): R;
  toContain(item: unknown): R;
  toHaveLength(length: number): R;
  toThrow(expected?: string | RegExp | (new (...args: never[]) => unknown)): R;
}

type AsyncMatchers = Matchers<Promise<void>> & { not: Matchers<Promise<void>> };

export interface Expectation extends Matchers<void> {
  not: Matchers<void>;
  resolves: AsyncMatchers;
  rejects: AsyncMatchers;
}

/** `expect(x).toBe(y)`, `.not`, `.resolves` i `.rejects` (njihovi matcheri vraćaju Promise koji test mora da sačeka). */
export function createExpect(): (received: unknown) => Expectation {
  return (received) => build(received, "sync", false) as unknown as Expectation;
}
