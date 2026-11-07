"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  label: string;
  names: Record<Locale, string>;
};

/** Ista stranica na drugom jeziku; izbor se pamti u cookie-ju da ga `proxy.ts` koristi pri sledećoj poseti. */
export function LanguageSwitcher({ locale, label, names }: Props) {
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav aria-label={label} className="flex gap-1 text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ""}`}
          lang={l}
          title={names[l]}
          aria-current={l === locale ? "true" : undefined}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={
            l === locale
              ? "rounded px-2 py-1 font-semibold underline underline-offset-4"
              : "rounded px-2 py-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
