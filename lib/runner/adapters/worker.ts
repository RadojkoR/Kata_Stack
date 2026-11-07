import type { OutMessage } from "../execute";
import {
  DEFAULT_TIMEOUT_MS,
  type LogEntry,
  type RunError,
  type RunInput,
  type RunResult,
  type Runner,
  type TestResult,
} from "../types";

/** Najmanji deo Worker API-ja koji koristimo, da bi se isti kod mogao testirati i van browsera. */
export interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((e: { data: unknown }) => void) | null;
  onerror: ((e: { message?: string }) => void) | null;
}

export type WorkerFactory = () => WorkerLike;

/**
 * Adapter `worker`: izvršava JavaScript u Web Worker-u. Za svako pokretanje se pravi nov Worker,
 * pa stanje jednog pokretanja ne može da utiče na sledeće, a `terminate()` prekida beskonačnu petlju.
 */
export function createWorkerRunner(createWorker: WorkerFactory): Runner {
  return {
    run(input: RunInput): Promise<RunResult> {
      const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const started = performance.now();
      const tests: TestResult[] = [];
      const logs: LogEntry[] = [];

      return new Promise<RunResult>((resolve) => {
        let finished = false;
        let worker: WorkerLike | undefined;

        const finish = (extra: { error?: RunError; timedOut?: boolean }) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          worker?.terminate();
          resolve({
            tests,
            logs,
            error: extra.error,
            timedOut: extra.timedOut ?? false,
            durationMs: Math.round(performance.now() - started),
          });
        };

        const timer = setTimeout(() => finish({ timedOut: true, error: { code: "timeout", ms: timeoutMs } }), timeoutMs);

        try {
          worker = createWorker();
        } catch (e) {
          finish({ error: { code: "worker", message: (e as Error).message } });
          return;
        }

        worker.onmessage = (e) => {
          const m = e.data as OutMessage;
          if (m.type === "log") logs.push(m.log);
          else if (m.type === "test") tests.push(m.test);
          else if (m.type === "done") finish({ error: m.error === undefined ? undefined : { code: "exception", message: m.error } });
        };
        worker.onerror = (e) => finish({ error: { code: "worker", message: e.message || "Worker error" } });

        worker.postMessage({ code: input.code, tests: input.tests, hiddenTests: input.hiddenTests });
      });
    },
  };
}
