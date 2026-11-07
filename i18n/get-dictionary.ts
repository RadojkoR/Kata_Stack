import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import type srDictionary from "./dictionaries/sr.json";

/** Oblik rečnika određuje `sr.json`; `en.json` mora da ima iste ključeve, inače TypeScript ne prolazi. */
export type Dictionary = typeof srDictionary;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  sr: () => import("./dictionaries/sr.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

/** Jezik trenutne putanje (`/sr/...` ili `/en/...`). Radi u Server Components. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}

/** Naziv taga iz rečnika; nepoznat tag se prikazuje kakav jeste. */
export function tagLabel(dict: Dictionary, tag: string): string {
  return (dict.tags as Record<string, string>)[tag] ?? tag;
}
