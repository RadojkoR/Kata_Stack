import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getExercises } from "@/lib/content";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Naslov (<title>) postavlja svaka stranica sama; ovde je samo opis.
export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { description: dict.meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    // data-theme se menja skriptom pre prvog iscrtavanja, pa React ne sme da prijavi razliku
    <html
      lang={locale}
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<div className="h-12 shrink-0 border-b border-zinc-200 dark:border-zinc-800" />}>
          <SiteHeader
            locale={locale}
            total={getExercises().length}
            labels={{ meta: dict.meta, nav: dict.nav, language: dict.language, theme: dict.theme, home: dict.home }}
          />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
