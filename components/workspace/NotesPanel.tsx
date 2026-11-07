"use client";

import { useEffect, useRef, useState } from "react";
import { getProgressStore } from "@/lib/storage";

const SAVE_DELAY_MS = 500;

type Props = {
  exerciseId: string;
  initialNotes: string;
  label: string;
  placeholder: string;
};

/** Beleške uz zadatak; čuvaju se sa zakašnjenjem i odmah pri zatvaranju panela ili stranice. */
export function NotesPanel({ exerciseId, initialNotes, label, placeholder }: Props) {
  const [value, setValue] = useState(initialNotes);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<string | null>(null);

  const flush = useRef(() => {});
  useEffect(() => {
    flush.current = () => {
      clearTimeout(timer.current);
      if (pending.current === null) return;
      const notes = pending.current;
      pending.current = null;
      void getProgressStore().saveNotes(exerciseId, notes);
    };
  }, [exerciseId]);

  // Ono što još nije sačuvano upisuje se pri napuštanju stranice i pri odmontiranju panela.
  useEffect(() => {
    const save = () => flush.current();
    window.addEventListener("pagehide", save);
    return () => {
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);

  return (
    <textarea
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        setValue(e.target.value);
        pending.current = e.target.value;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flush.current(), SAVE_DELAY_MS);
      }}
      className="h-full min-h-40 w-full resize-none rounded border border-zinc-300 bg-transparent p-3 text-sm outline-none focus:border-blue-500 dark:border-zinc-700"
    />
  );
}
