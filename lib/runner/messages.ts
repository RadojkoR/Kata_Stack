import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localize } from "@/i18n/localized";
import type { RunError, TestResult } from "./types";

/** Runner vraća kodove i vrednosti; ovde se pretvaraju u rečenice na izabranom jeziku. */

type RunnerLabels = Dictionary["runner"];

export function interpolate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function testTitle(test: TestResult, locale: Locale, labels: RunnerLabels): string {
  if (test.hidden) return interpolate(labels.hiddenTest, { n: test.hiddenIndex });
  return typeof test.name === "string" ? test.name : localize(test.name, locale);
}

/** Objašnjenje zašto je test pao, ili `undefined` ako je prošao. */
export function failureMessage(test: TestResult, labels: RunnerLabels): string | undefined {
  if (test.passed || test.hidden) return undefined;
  if (test.error) return test.error;

  const vars = { expected: test.expected, actual: test.actual, matcher: test.failure?.matcher };
  switch (test.failure?.code) {
    case "mismatch":
      return interpolate(labels.assertion.mismatch, vars);
    case "negated":
      return interpolate(labels.assertion.negated, vars);
    case "not-thrown":
      return interpolate(labels.assertion.notThrown, vars);
    case "resolved-unexpectedly":
      return interpolate(labels.assertion.resolvedUnexpectedly, vars);
    case "rejected-unexpectedly":
      return interpolate(labels.assertion.rejectedUnexpectedly, vars);
    default:
      return undefined;
  }
}

export function runErrorMessage(error: RunError, labels: RunnerLabels): string {
  switch (error.code) {
    case "timeout":
      return interpolate(labels.timeout, { ms: error.ms });
    case "exception":
      return `${labels.exception}: ${error.message}`;
    case "transpile":
      return `${labels.transpile}: ${error.message}`;
    case "worker":
      return `${labels.worker}: ${error.message}`;
  }
}
