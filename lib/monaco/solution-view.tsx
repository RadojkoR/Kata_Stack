import type { editor as MonacoEditor } from "monaco-editor";
import { createRoot, type Root } from "react-dom/client";
import type { CodeEditorHandle } from "@/components/workspace/CodeEditor";
import { SimpleMarkdown } from "@/components/workspace/SimpleMarkdown";

/**
 * Prikaz rešenja u istom editoru: kod rešenja se otvara samo za čitanje, linije koje se objašnjavaju su istaknute,
 * a objašnjenje je upisano ispod njih (Monaco "view zone"). Korisnikov kod ostaje u svom modelu, sa istorijom
 * izmena, i vraća se kad se pregled zatvori.
 */

export type StepView = {
  code: string;
  language: "javascript" | "typescript";
  /** Jedinstvena putanja modela rešenja. */
  path: string;
  from: number;
  to: number;
  text: string;
};

export interface SolutionViewer {
  show(step: StepView): void;
  /** Zatvara pregled i vraća korisnikov kod. Bezbedno je pozvati više puta. */
  exit(): void;
  /** Kod koji je korisnik pisao, dok je pregled otvoren; inače `null`. */
  getUserCode(): string | null;
}

/** Objašnjenje zauzima najviše ovoliki deo visine editora; ostatak se skroluje unutar njega. */
const MAX_ZONE_RATIO = 0.6;
const INITIAL_ZONE_HEIGHT = 40;

export function createSolutionViewer({ editor, monaco }: CodeEditorHandle): SolutionViewer {
  const tsDefaults = monaco.typescript.typescriptDefaults;
  const jsDefaults = monaco.typescript.javascriptDefaults;
  type Diagnostics = ReturnType<typeof tsDefaults.getDiagnosticsOptions>;

  let userModel: MonacoEditor.ITextModel | null = null;
  let created: MonacoEditor.ITextModel[] = [];
  let decorations: MonacoEditor.IEditorDecorationsCollection | null = null;
  let zoneId: string | null = null;
  let root: Root | null = null;
  let savedDiagnostics: { ts: Diagnostics; js: Diagnostics } | null = null;

  function clearStep() {
    decorations?.clear();
    decorations = null;
    if (zoneId !== null) {
      const id = zoneId;
      editor.changeViewZones((accessor) => accessor.removeZone(id));
      zoneId = null;
    }
    if (root) {
      // React ne dozvoljava sinhrono odmontiranje dok se renderuje, pa se odlaže.
      const old = root;
      setTimeout(() => old.unmount(), 0);
      root = null;
    }
  }

  return {
    show(step) {
      if (!userModel) {
        userModel = editor.getModel();
        editor.updateOptions({ readOnly: true });

        // Rešenje i korisnikov kod su u istom TypeScript projektu i oba su "skripte", pa bi se ista imena prijavljivala
        // kao duplikati. Dok je pregled otvoren, markeri grešaka se isključuju.
        savedDiagnostics = { ts: tsDefaults.getDiagnosticsOptions(), js: jsDefaults.getDiagnosticsOptions() };
        const off = { noSemanticValidation: true, noSyntaxValidation: true };
        tsDefaults.setDiagnosticsOptions({ ...savedDiagnostics.ts, ...off });
        jsDefaults.setDiagnosticsOptions({ ...savedDiagnostics.js, ...off });
      }
      clearStep();

      const uri = monaco.Uri.parse(step.path);
      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(step.code, step.language, uri);
        created.push(model);
      }
      if (editor.getModel() !== model) editor.setModel(model);

      decorations = editor.createDecorationsCollection([
        {
          range: new monaco.Range(step.from, 1, step.to, 1),
          options: { isWholeLine: true, className: "ks-step-highlight", linesDecorationsClassName: "ks-step-bar" },
        },
      ]);

      const node = document.createElement("div");
      node.className = "ks-step-zone";
      // Točak miša skroluje objašnjenje, a ne editor ispod njega.
      node.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
      root = createRoot(node);
      root.render(<SimpleMarkdown source={step.text} />);

      const zone: MonacoEditor.IViewZone = {
        afterLineNumber: step.to,
        heightInPx: INITIAL_ZONE_HEIGHT,
        domNode: node,
        suppressMouseDown: true, // da se tekst objašnjenja može označiti
      };
      editor.changeViewZones((accessor) => {
        zoneId = accessor.addZone(zone);
      });

      // Visina se meri tek kad React iscrta sadržaj.
      const fit = () => {
        if (zoneId === null) return;
        const max = Math.floor(editor.getLayoutInfo().height * MAX_ZONE_RATIO);
        zone.heightInPx = Math.max(INITIAL_ZONE_HEIGHT, Math.min(node.scrollHeight + 2, max));
        editor.changeViewZones((accessor) => accessor.layoutZone(zoneId!));
      };
      requestAnimationFrame(() => requestAnimationFrame(fit));

      editor.revealLinesInCenterIfOutsideViewport(step.from, step.to);
    },

    exit() {
      if (!userModel) return;
      try {
        clearStep();
        editor.setModel(userModel);
        editor.updateOptions({ readOnly: false });
        for (const model of created) model.dispose();
      } catch {
        // editor je već uništen (npr. napuštena stranica); nema šta da se vraća
      }
      created = [];
      userModel = null;

      if (savedDiagnostics) {
        tsDefaults.setDiagnosticsOptions(savedDiagnostics.ts);
        jsDefaults.setDiagnosticsOptions(savedDiagnostics.js);
        savedDiagnostics = null;
      }
    },

    getUserCode() {
      return userModel ? userModel.getValue() : null;
    },
  };
}
