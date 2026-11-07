"use client";

import Editor, { loader, type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEffect, useRef } from "react";
import { configureMonaco } from "@/lib/monaco/setup";
import type { Theme } from "@/lib/theme";

// Monaco se servira sa našeg sajta (scripts/copy-monaco.mjs), ista verzija kao instalirani paket.
loader.config({ paths: { vs: "/monaco/vs" } });

export type CodeEditorHandle = { editor: editor.IStandaloneCodeEditor; monaco: Monaco };

type Props = {
  /** Jedinstvena putanja modela; razdvaja modele različitih zadataka. */
  path: string;
  language: "javascript" | "typescript";
  initialValue: string;
  theme: Theme;
  loadingLabel: string;
  onChange: (value: string) => void;
  onReady: (handle: CodeEditorHandle) => void;
  onRun: () => void;
  onSubmit: () => void;
  onToggleFocus: () => void;
};

export function CodeEditor({
  path,
  language,
  initialValue,
  theme,
  loadingLabel,
  onChange,
  onReady,
  onRun,
  onSubmit,
  onToggleFocus,
}: Props) {
  // Prečice se registruju jednom, a pozivaju uvek najnoviju verziju funkcija.
  const actions = useRef({ onRun, onSubmit, onToggleFocus });
  useEffect(() => {
    actions.current = { onRun, onSubmit, onToggleFocus };
  });

  return (
    <Editor
      height="100%"
      path={path}
      language={language}
      defaultValue={initialValue}
      theme={theme === "dark" ? "vs-dark" : "light"}
      loading={<div className="p-4 text-sm text-zinc-500">{loadingLabel}</div>}
      beforeMount={configureMonaco}
      onChange={(value) => onChange(value ?? "")}
      onMount={(editor, monaco) => {
        const { KeyMod, KeyCode } = monaco;
        // Monaco sam troši Ctrl+Enter ("nova linija ispod"), pa prečice moraju da se registruju u editoru.
        editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => actions.current.onRun());
        editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter, () => actions.current.onSubmit());
        editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF, () => actions.current.onToggleFocus());
        onReady({ editor, monaco });
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        tabSize: 2,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        fixedOverflowWidgets: true,
      }}
    />
  );
}
