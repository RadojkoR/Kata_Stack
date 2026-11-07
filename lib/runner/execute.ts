import { AssertionError, createExpect } from "./test-lib/expect";
import { formatLogArgs } from "./test-lib/format";
import type { LogEntry, TestName, TestResult } from "./types";

/** Jezgro izvršavanja. Radi u Web Worker-u, ali ne zavisi od njega, pa se testira i u Node-u. */

export interface ExecInput {
  code: string;
  tests: string;
  hiddenTests?: string;
}

export type OutMessage =
  | { type: "log"; log: LogEntry }
  | { type: "test"; test: TestResult }
  /** `error` je izvorna poruka izuzetka bačenog pri učitavanju koda. */
  | { type: "done"; error?: string };

export const MAX_LOGS = 200;

function describeError(e: unknown): string {
  if (typeof e === "object" && e !== null && "message" in e) {
    const { name, message } = e as { name?: unknown; message: unknown };
    return `${typeof name === "string" ? name : "Error"}: ${String(message)}`;
  }
  return String(e);
}

function isTestName(v: unknown): v is TestName {
  if (typeof v === "string") return true;
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.sr === "string" && typeof o.en === "string";
}

interface Registered {
  name: TestName;
  fn: () => unknown;
  hidden: boolean;
}

export async function executeTests(input: ExecInput, emit: (m: OutMessage) => void): Promise<void> {
  const registry: Registered[] = [];
  let hidden = false;

  const test = (name: unknown, fn: unknown) => {
    if (!isTestName(name) || typeof fn !== "function") {
      throw new TypeError("test(name, fn): name must be a string or { sr, en }, fn must be a function");
    }
    registry.push({ name, fn: fn as () => unknown, hidden });
  };

  let logCount = 0;
  const logger = (level: LogEntry["level"]) => (...args: unknown[]) => {
    logCount++;
    if (logCount <= MAX_LOGS) emit({ type: "log", log: { level, text: formatLogArgs(args) } });
    else if (logCount === MAX_LOGS + 1) {
      emit({ type: "log", log: { level: "warn", text: `… (limit: ${MAX_LOGS})` } });
    }
  };
  const consoleShim = {
    log: logger("log"),
    info: logger("log"),
    debug: logger("log"),
    warn: logger("warn"),
    error: logger("error"),
  };

  try {
    const source = `"use strict";\n${input.code}\n;\n${input.tests}\n;__beginHidden();\n${input.hiddenTests ?? ""}`;
    const run = new Function("test", "expect", "console", "__beginHidden", source) as (...a: unknown[]) => void;
    run(test, createExpect(), consoleShim, () => {
      hidden = true;
    });
  } catch (e) {
    emit({ type: "done", error: describeError(e) });
    return;
  }

  let hiddenCount = 0;
  for (const t of registry) {
    const base = t.hidden ? { name: "", hidden: true, hiddenIndex: ++hiddenCount } : { name: t.name };
    try {
      await t.fn();
      emit({ type: "test", test: { ...base, passed: true } });
    } catch (e) {
      if (t.hidden) {
        emit({ type: "test", test: { ...base, passed: false } });
      } else if (e instanceof AssertionError) {
        emit({
          type: "test",
          test: {
            ...base,
            passed: false,
            failure: { code: e.code, matcher: e.matcher },
            expected: e.expected,
            actual: e.actual,
          },
        });
      } else {
        emit({ type: "test", test: { ...base, passed: false, error: describeError(e) } });
      }
    }
  }

  emit({ type: "done" });
}
