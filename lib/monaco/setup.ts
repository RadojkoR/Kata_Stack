import type { Monaco } from "@monaco-editor/react";
import { TEST_API_DTS } from "@/lib/runner/test-lib/dts";
import type { TypeChecker } from "@/lib/runner/adapters/worker-ts";

/** Podešavanje Monaco-a: opcije kompajlera i deklaracije `test` / `expect` za autocomplete. Radi se jednom. */
let configured = false;

export function configureMonaco(monaco: Monaco): void {
  if (configured) return;
  configured = true;

  const { typescriptDefaults, javascriptDefaults, ScriptTarget } = monaco.typescript;
  const options = {
    target: ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    strict: true,
    noEmit: true,
    lib: ["esnext"],
  };
  typescriptDefaults.setCompilerOptions(options);
  javascriptDefaults.setCompilerOptions({ ...options, strict: false });

  for (const defaults of [typescriptDefaults, javascriptDefaults]) {
    defaults.addExtraLib(TEST_API_DTS, "ts:test-api.d.ts");
  }
}

type MessageChain = string | { messageText: string; next?: MessageChain[] };

function flatten(message: MessageChain, depth = 0): string {
  if (typeof message === "string") return message;
  const rest = (message.next ?? []).map((m) => flatten(m, depth + 1));
  return [message.messageText, ...rest].join("\n" + "  ".repeat(depth + 1)).trim();
}

/**
 * Provera tipova preko Monaco TypeScript servisa. Izvor se proverava u posebnom modelu koji je modul
 * (`export {};` na istoj liniji, pa brojevi linija ostaju isti), da se imena ne sudaraju sa kodom u editoru.
 */
export function createMonacoTypeChecker(getMonaco: () => Promise<Monaco>): TypeChecker {
  let counter = 0;

  return async (source) => {
    const monaco = await getMonaco();
    configureMonaco(monaco);

    const uri = monaco.Uri.parse(`file:///check/${++counter}.ts`);
    const model = monaco.editor.createModel(`export {}; ${source}`, "typescript", uri);
    try {
      const getWorker = await monaco.typescript.getTypeScriptWorker();
      const worker = await getWorker(uri);
      const [syntactic, semantic] = await Promise.all([
        worker.getSyntacticDiagnostics(uri.toString()),
        worker.getSemanticDiagnostics(uri.toString()),
      ]);

      return [...syntactic, ...semantic]
        .filter((d) => d.start !== undefined)
        .map((d) => {
          const position = model.getPositionAt(d.start!);
          return { line: position.lineNumber, column: position.column, message: flatten(d.messageText as MessageChain) };
        });
    } finally {
      model.dispose();
    }
  };
}
