/** Pomoćni kod samo za Vitest: pokreće isti kod van browsera. Ne uvozi se iz aplikacije. */
import { Worker } from "node:worker_threads";
import ts from "typescript";
import { executeTests, type ExecInput } from "./execute";
import type { TypeChecker } from "./adapters/worker-ts";
import type { WorkerFactory, WorkerLike } from "./adapters/worker";

/** "Worker" koji izvršava test u istom procesu. Ne može da prekine beskonačnu petlju. */
export const createInProcessWorker: WorkerFactory = () => {
  let terminated = false;
  const w: WorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage(message) {
      setTimeout(() => {
        void executeTests(message as ExecInput, (out) => {
          setTimeout(() => {
            if (!terminated) w.onmessage?.({ data: out });
          }, 0);
        });
      }, 0);
    },
    terminate() {
      terminated = true;
    },
  };
  return w;
};

/** Pravi Node `worker_threads` Worker iz fajla, sa istim sučeljem kao Web Worker. */
export function createNodeWorker(file: string): WorkerFactory {
  return () => {
    const nodeWorker = new Worker(file);
    const w: WorkerLike = {
      onmessage: null,
      onerror: null,
      postMessage: (m) => nodeWorker.postMessage(m),
      terminate: () => void nodeWorker.terminate(),
    };
    nodeWorker.on("message", (data) => w.onmessage?.({ data }));
    nodeWorker.on("error", (e) => w.onerror?.({ message: e.message }));
    return w;
  };
}

/** Provera tipova preko TypeScript kompajlera; u browseru to radi Monaco. */
export function createTsChecker(): TypeChecker {
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts"],
    types: [],
    skipLibCheck: true,
  };

  return async (source) => {
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    const readFile = host.readFile.bind(host);
    host.getSourceFile = (name, ...rest) =>
      name === "main.ts" ? ts.createSourceFile(name, source, ts.ScriptTarget.ES2022) : getSourceFile(name, ...rest);
    host.fileExists = (name) => name === "main.ts" || fileExists(name);
    host.readFile = (name) => (name === "main.ts" ? source : readFile(name));

    const program = ts.createProgram(["main.ts"], options, host);
    return ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file?.fileName === "main.ts" && d.start !== undefined)
      .map((d) => {
        const { line, character } = d.file!.getLineAndCharacterOfPosition(d.start!);
        return { line: line + 1, column: character + 1, message: ts.flattenDiagnosticMessageText(d.messageText, "\n") };
      });
  };
}
