import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { resolveLocale } from "@/i18n/negotiate";

/** Putanja bez jezika (npr. `/` ili `/exercise/x`) se preusmerava na `/sr/...` ili `/en/...`. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocalePrefix = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocalePrefix) return;

  const locale = resolveLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Preskače API, interne Next.js putanje i fajlove sa ekstenzijom (ikone, slike...).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
