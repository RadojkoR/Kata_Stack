import { transpileTs } from "../transpile";
import type { RunInput, RunResult, Runner, TypeErrorInfo } from "../types";
import { createWorkerRunner, type WorkerFactory } from "./worker";

/** Proverava tipove u kodu. U browseru ga implementira Monaco TypeScript servis (Korak 6). */
export type TypeChecker = (source: string) => Promise<TypeErrorInfo[]>;

/**
 * Adapter `worker-ts`: prevodi TypeScript u JavaScript pa ga izvršava kao `worker`.
 * Greške tipova se prijavljuju posebno i ne obaraju testove.
 */
export function createWorkerTsRunner(createWorker: WorkerFactory, typeCheck?: TypeChecker): Runner {
  const inner = createWorkerRunner(createWorker);

  return {
    async run(input: RunInput): Promise<RunResult> {
      let js: RunInput;
      try {
        js = {
          ...input,
          code: transpileTs(input.code),
          tests: transpileTs(input.tests),
          hiddenTests: input.hiddenTests === undefined ? undefined : transpileTs(input.hiddenTests),
        };
      } catch (e) {
        return {
          tests: [],
          logs: [],
          error: { code: "transpile", message: (e as Error).message },
          timedOut: false,
          durationMs: 0,
        };
      }

      const [result, typeErrors] = await Promise.all([inner.run(js), typeCheck ? typeCheck(input.code) : undefined]);
      return typeErrors ? { ...result, typeErrors } : result;
    },
  };
}
