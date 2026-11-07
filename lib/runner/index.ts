import type { Runtime } from "@/types/exercise";
import { createTypesRunner } from "./adapters/types-only";
import { createWorkerRunner, type WorkerFactory } from "./adapters/worker";
import { createWorkerTsRunner, type TypeChecker } from "./adapters/worker-ts";
import type { RunInput, RunResult, Runner } from "./types";

export * from "./types";
export type { TypeChecker, WorkerFactory };

export class UnsupportedRuntimeError extends Error {
  constructor(readonly runtime: Runtime) {
    super(`Runtime "${runtime}" is not supported yet`);
    this.name = "UnsupportedRuntimeError";
  }
}

export interface RunnerDeps {
  createWorker: WorkerFactory;
  /** Obavezan za `types`, opcion za `worker-ts` (u browseru ga daje Monaco). */
  typeCheck?: TypeChecker;
}

/** UI ne zna gde se kod izvršava: zadatak kaže `runtime`, a ovde se bira adapter. */
export function getRunner(runtime: Runtime, deps: RunnerDeps): Runner {
  switch (runtime) {
    case "worker":
      return createWorkerRunner(deps.createWorker);
    case "worker-ts":
      return createWorkerTsRunner(deps.createWorker, deps.typeCheck);
    case "types":
      if (!deps.typeCheck) throw new Error('Runtime "types" requires a typeCheck function');
      return createTypesRunner(deps.typeCheck);
    default:
      throw new UnsupportedRuntimeError(runtime);
  }
}

export function runCode(runtime: Runtime, input: RunInput, deps: RunnerDeps): Promise<RunResult> {
  return getRunner(runtime, deps).run(input);
}
