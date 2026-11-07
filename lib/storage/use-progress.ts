"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ExerciseProgress } from "@/types/progress";
import { createSafeStorage } from "./browser";
import { PROGRESS_EVENT } from "./index";
import { PROGRESS_KEY } from "./localStorageStore";
import { parseProgressMap } from "./parse";

const storage = createSafeStorage();

function subscribe(onChange: () => void) {
  window.addEventListener(PROGRESS_EVENT, onChange);
  window.addEventListener("storage", onChange); // promena iz drugog taba
  return () => {
    window.removeEventListener(PROGRESS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Napredak svih zadataka; osvežava se sam kad se promeni. Na serveru je prazan. */
export function useProgressMap(): Record<string, ExerciseProgress> {
  // Snapshot je sirovi string (stabilan dok se podaci ne promene), pa nema nepotrebnih renderovanja.
  const raw = useSyncExternalStore(
    subscribe,
    () => storage.getItem(PROGRESS_KEY),
    () => null,
  );
  return useMemo(() => parseProgressMap(raw).value, [raw]);
}

export function useExerciseProgress(exerciseId: string): ExerciseProgress | null {
  return useProgressMap()[exerciseId] ?? null;
}
