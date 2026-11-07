export const locales = ["sr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sr";

/** Cookie u koji se pamti poslednje izabrani jezik. */
export const LOCALE_COOKIE = "ks_lang";

export function hasLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
