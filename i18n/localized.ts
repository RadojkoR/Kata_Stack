import { z } from "zod";
import type { Locale } from "./config";

/** Tekst na oba jezika. Zod traži oba, pa build pada ako jedan nedostaje. */
export const LocalizedStringSchema = z.strictObject({
  sr: z.string().min(1),
  en: z.string().min(1),
});

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

export function localize(value: LocalizedString, locale: Locale): string {
  return value[locale];
}
