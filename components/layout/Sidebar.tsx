"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { COMING_SOON_AREAS } from "@/lib/browse";
import { useProgressMap } from "@/lib/storage/use-progress";
import type { Area } from "@/types/exercise";
import { isSolved } from "@/types/progress";

export type SidebarArea = { area: Area; ids: string[] };

type Props = {
  locale: Locale;
  areas: SidebarArea[];
  labels: Pick<Dictionary, "areas" | "nav">;
};

const itemClass = (active: boolean, muted = false) =>
  `flex items-center justify-between gap-2 rounded px-2.5 py-1.5 text-sm transition-colors ${
    active
      ? "bg-blue-500/10 font-medium text-blue-700 dark:text-blue-300"
      : `${muted ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-700 dark:text-zinc-300"} hover:bg-zinc-100 dark:hover:bg-zinc-800/60`
  }`;

/**
 * Bočni meni: oblasti sa napretkom, a Podešavanja na dnu. Na uskom ekranu se oblasti
 * prikazuju kao horizontalna traka iznad sadržaja, a Podešavanja su u meniju zaglavlja.
 */
export function Sidebar({ locale, areas, labels }: Props) {
  const pathname = usePathname();
  const progress = useProgressMap();
  const homeHref = `/${locale}`;
  const settingsHref = `/${locale}/settings`;

  const entries = areas.map(({ area, ids }) => ({
    area,
    href: `/${locale}/area/${area}`,
    solved: ids.filter((id) => isSolved(progress[id])).length,
    total: ids.length,
    soon: COMING_SOON_AREAS.includes(area),
  }));

  return (
    <>
      <aside
        aria-label={labels.nav.areasMenu}
        className="sticky top-12 hidden h-[calc(100dvh-3rem)] w-44 shrink-0 flex-col border-r border-zinc-200 p-2 md:flex dark:border-zinc-800"
      >
        <Link
          href={homeHref}
          aria-current={pathname === homeHref ? "page" : undefined}
          className={`${itemClass(pathname === homeHref)} mb-4`}
        >
          {labels.nav.overview}
        </Link>

        <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{labels.nav.areas}</p>
        <nav aria-label={labels.nav.areas} className="flex flex-col gap-1">
          {entries.map((e) => {
            const active = pathname === e.href;
            return (
              <Link key={e.area} href={e.href} aria-current={active ? "page" : undefined} className={itemClass(active, e.soon)}>
                <span>{labels.areas[e.area]}</span>
                <span className="text-xs tabular-nums text-zinc-500">{e.soon ? "—" : `${e.solved}/${e.total}`}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <Link
            href={settingsHref}
            aria-current={pathname === settingsHref ? "page" : undefined}
            className={itemClass(pathname === settingsHref)}
          >
            {labels.nav.settings}
          </Link>
        </div>
      </aside>

      <nav
        aria-label={labels.nav.areas}
        className="flex gap-2 overflow-x-auto border-b border-zinc-200 px-4 py-2 md:hidden dark:border-zinc-800"
      >
        <Link
          href={homeHref}
          aria-current={pathname === homeHref ? "page" : undefined}
          className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
            pathname === homeHref
              ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
              : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          {labels.nav.overview}
        </Link>
        {entries.map((e) => {
          const active = pathname === e.href;
          return (
            <Link
              key={e.area}
              href={e.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
                active
                  ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {labels.areas[e.area]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
