// Worker koji ispiše jedan log, pa upadne u beskonačnu petlju. Koristi se za test timeout-a.
import { parentPort } from "node:worker_threads";

parentPort.on("message", () => {
  parentPort.postMessage({ type: "log", log: { level: "log", text: "pre petlje" } });
  while (true) {
    // beskonačna petlja
  }
});
