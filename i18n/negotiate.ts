import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { defaultLocale, hasLocale, locales, type Locale } from "./config";

/** Redosled: cookie sa izabranim jezikom → `Accept-Language` → podrazumevani jezik. */
export function resolveLocale(input: { cookie?: string | null; acceptLanguage?: string | null }): Locale {
  if (hasLocale(input.cookie)) return input.cookie;

  try {
    const languages = new Negotiator({ headers: { "accept-language": input.acceptLanguage ?? "" } }).languages();
    return match(languages, locales, defaultLocale) as Locale;
  } catch {
    // nevažeća oznaka jezika u zaglavlju (npr. "*" ili smeće)
    return defaultLocale;
  }
}
