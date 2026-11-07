export const locales = ["sr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sr";

/** Oznaka za `Intl` formatiranje. Srpski je latinica: sam `sr` bi dao ćirilicu. */
export const INTL_LOCALE: Record<Locale, string> = { sr: "sr-Latn", en: "en" };

/** Cookie u koji se pamti poslednje izabrani jezik. */
export const LOCALE_COOKIE = "ks_lang";

export function hasLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
