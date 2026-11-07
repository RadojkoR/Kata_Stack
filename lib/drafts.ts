import { z } from "zod";
import type { SafeStorage } from "./storage/browser";

/** Nesačuvan kod u editoru, po zadatku. Ključ: `ks:v1:draft:<exerciseId>`. */
const DraftSchema = z.object({ code: z.string(), savedAt: z.string() });

const key = (exerciseId: string) => `v1:draft:${exerciseId}`;

export function loadDraft(storage: SafeStorage, exerciseId: string): string | null {
  const raw = storage.getItem(key(exerciseId));
  if (!raw) return null;
  try {
    const parsed = DraftSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data.code;
    console.warn(`Nevažeći nacrt koda za ${exerciseId}, preskačem.`);
  } catch {
    console.warn(`Nacrt koda za ${exerciseId} nije validan JSON, preskačem.`);
  }
  return null;
}

export function saveDraft(storage: SafeStorage, exerciseId: string, code: string): void {
  storage.setItem(key(exerciseId), JSON.stringify({ code, savedAt: new Date().toISOString() }));
}

export function clearDraft(storage: SafeStorage, exerciseId: string): void {
  storage.removeItem(key(exerciseId));
}
