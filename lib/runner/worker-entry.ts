import { executeTests, type ExecInput } from "./execute";

// Ulazna tačka Web Worker-a. Bundler je pravi iz `new URL("./worker-entry.ts", import.meta.url)`.
const ctx = self as unknown as {
  postMessage(message: unknown): void;
  onmessage: ((e: { data: ExecInput }) => void) | null;
};

ctx.onmessage = (e) => {
  void executeTests(e.data, (m) => ctx.postMessage(m));
};
