import type { WorkerFactory } from "./adapters/worker";

/** Pravi Web Worker u browseru. Uvozi se samo iz klijentskog koda. */
export const createBrowserWorker: WorkerFactory = () =>
  new Worker(new URL("./worker-entry.ts", import.meta.url), { type: "module" }) as unknown as ReturnType<WorkerFactory>;
