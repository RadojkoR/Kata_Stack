import type { RunInput, RunResult, Runner, TestResult, TypeErrorInfo } from "../types";
import type { TypeChecker } from "./worker-ts";

/** Pomoćni tipovi za zadatke o tipovima. `export {}` pretvara fajl u modul, da se imena ne sudaraju sa globalnim. */
export const TYPE_HELPERS = [
  "type Expect<T extends true> = T;",
  "type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;",
  "export {};",
].join("\n");

const HELPER_LINES = TYPE_HELPERS.split("\n").length;

const CODE_HAS_NO_ERRORS = { sr: "Kod nema grešaka tipova", en: "Code has no type errors" };

/** Linije u kojima počinje `Expect<...>`, relativno u odnosu na `block` (brojanje od 0). */
function expectLines(block: string): number[] {
  return block
    .split("\n")
    .flatMap((line, i) => (/\bExpect\s*</.test(line) ? [i] : []));
}

/**
 * Adapter `types`: ništa se ne izvršava. Kod, pomoćni tipovi i "testovi" (`Expect<Equal<A, B>>`) se
 * spajaju u jedan izvor i proveravaju. Svaka `Expect` linija je jedan test, a prolazi kad na njoj nema greške.
 */
export function createTypesRunner(typeCheck: TypeChecker): Runner {
  return {
    async run(input: RunInput): Promise<RunResult> {
      const started = performance.now();
      const codeLines = input.code.split("\n").length;
      const testLines = input.tests.split("\n").length;

      const source = [TYPE_HELPERS, input.code, input.tests, input.hiddenTests ?? ""].join("\n");
      const diagnostics = await typeCheck(source);

      const codeStart = HELPER_LINES + 1;
      const testsStart = codeStart + codeLines;
      const hiddenStart = testsStart + testLines;

      const inCode = (d: TypeErrorInfo) => d.line >= codeStart && d.line < testsStart;
      const codeErrors = diagnostics.filter(inCode).map((d) => ({ ...d, line: d.line - HELPER_LINES }));

      const tests: TestResult[] = [{ name: CODE_HAS_NO_ERRORS, passed: codeErrors.length === 0 }];

      const addBlock = (block: string, start: number, hidden: boolean) => {
        const starts = expectLines(block);
        const errorLines = diagnostics.filter((d) => d.line >= start && d.line < start + block.split("\n").length);
        starts.forEach((s, i) => {
          const first = start + s;
          const last = start + (starts[i + 1] ?? block.split("\n").length);
          const failing = errorLines.find((d) => d.line >= first && d.line < last);
          const line = block.split("\n")[s].trim();
          tests.push(
            hidden
              ? { name: "", hidden: true, hiddenIndex: tests.filter((t) => t.hidden).length + 1, passed: !failing }
              : { name: line, passed: !failing, error: failing?.message },
          );
        });
      };

      addBlock(input.tests, testsStart, false);
      if (input.hiddenTests) addBlock(input.hiddenTests, hiddenStart, true);

      return {
        tests,
        logs: [],
        typeErrors: codeErrors,
        timedOut: false,
        durationMs: Math.round(performance.now() - started),
      };
    },
  };
}
