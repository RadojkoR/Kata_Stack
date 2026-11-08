"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { solvedSets } from "@/lib/browse";
import { interpolate } from "@/lib/runner/messages";
import { useProgressMap } from "@/lib/storage/use-progress";
import { Bar } from "../home/Bar";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { ThemeToggle } from "../ThemeToggle";

type Props = {
  locale: Locale;
  /** Ukupan broj zadataka, za prikaz napretka. */
  total: number;
  labels: Pick<Dictionary, "meta" | "nav" | "language" | "theme" | "home">;
};

/** Fiksna gornja traka: logo, navigacija, napredak, jezik i tema. Na malim ekranima sve osim loga ide u meni. */
export function SiteHeader({ locale, total, labels }: Props) {
  const pathname = usePathname();
  const progress = useProgressMap();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const { solvedIds, helpedIds } = solvedSets(progress);
  const solved = solvedIds.size;
  const stats = { solved, helped: helpedIds.size, total };
  const progressLabel = interpolate(labels.home.overall, { solved, total });

  // Meni se zatvara na Escape i na klik van trake.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [open]);

  const home = `/${locale}`;
  // Pregled i oblasti su u bočnom meniju (na telefonu u traci iznad sadržaja). Na računaru su tamo i
  // Podešavanja, a na telefonu bočnog menija nema, pa su ovde, u meniju ☰.
  const mobileItems = [
    { href: `${home}/settings`, label: labels.nav.settings, active: pathname === `${home}/settings` },
  ];

  const linkClass = (active: boolean) =>
    `rounded px-3 py-1.5 text-sm transition-colors ${
      active
        ? "bg-zinc-200/70 font-medium dark:bg-zinc-800"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
    }`;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 h-12 shrink-0 border-b border-zinc-200 bg-background/85 backdrop-blur dark:border-zinc-800"
    >
      <div className="flex h-full w-full items-center gap-3 px-4">
        <Link href={home} className="mr-2 font-semibold tracking-tight" onClick={() => setOpen(false)}>
          {labels.meta.title}
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={home}
            title={progressLabel}
            aria-label={progressLabel}
            className="flex items-center gap-2 rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
          >
            <span className="hidden w-16 md:block">
              <Bar stats={stats} />
            </span>
            <span className="tabular-nums">
              {solved}/{total}
            </span>
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            <LanguageSwitcher locale={locale} label={labels.language.label} names={labels.language} />
            <ThemeToggle label={labels.theme.toggle} names={labels.theme} />
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? labels.nav.closeMenu : labels.nav.menu}
            onClick={() => setOpen((o) => !o)}
            className="rounded px-2 py-1 text-lg leading-none text-zinc-600 hover:bg-zinc-100 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800/60"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-12 space-y-3 border-b border-zinc-200 bg-background p-4 shadow-lg sm:hidden dark:border-zinc-800"
        >
          <nav aria-label={labels.nav.main} className="flex flex-col gap-1">
            {mobileItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={linkClass(item.active)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <LanguageSwitcher locale={locale} label={labels.language.label} names={labels.language} />
            <ThemeToggle label={labels.theme.toggle} names={labels.theme} />
          </div>
        </div>
      )}
    </header>
  );
}
