"use client";

import Link from "next/link";
import { useMemo } from "react";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  COMING_SOON_AREAS,
  countSolved,
  levelStats,
  recentActivity,
  type BrowseItem,
  type RecentEntry,
} from "@/lib/browse";
import { interpolate } from "@/lib/runner/messages";
import { useProgressMap } from "@/lib/storage/use-progress";
import { AREAS, LEVELS } from "@/types/exercise";
import { isSolved } from "@/types/progress";
import { Bar } from "./Bar";

type Labels = Pick<Dictionary, "areas" | "levels" | "home" | "nav">;

type Props = {
  items: BrowseItem[];
  locale: Locale;
  labels: Labels;
};

/** Glavni dashboard: ukupni napredak, šta je poslednje rađeno i napredak po oblastima. */
export function Overview({ items, locale, labels }: Props) {
  const progress = useProgressMap();
  const solvedIds = useMemo(
    () => new Set(Object.values(progress).filter(isSolved).map((p) => p.exerciseId)),
    [progress],
  );
  const stats = useMemo(() => levelStats(items, solvedIds), [items, solvedIds]);
  const overall = countSolved(items, solvedIds);
  const recent = useMemo(() => recentActivity(items, progress, 5), [items, progress]);

  // Prvi nerešen zadatak sa liste je ono na čemu se nastavlja.
  const resume = recent.find((r) => !isSolved(r.progress) && r.item.playable);
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">{labels.nav.overview}</h1>
        <p className="text-sm text-zinc-500">{interpolate(labels.home.overall, overall)}</p>
        <div className="max-w-md">
          <Bar stats={overall} thick />
        </div>
      </header>

      <section aria-labelledby="recent-title" className="space-y-3">
        <h2 id="recent-title" className="text-lg font-semibold">
          {labels.home.recentTitle}
        </h2>

        {recent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
            {labels.home.recentEmpty}
          </p>
        ) : (
          <>
            {resume && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-500/40 bg-blue-500/5 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{resume.item.title}</p>
                  <p className="text-xs text-zinc-500">
                    {labels.areas[resume.item.area]} · {labels.levels[resume.item.level]}
                  </p>
                </div>
                <Link
                  href={`/${locale}/exercise/${resume.item.id}`}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
                >
                  {labels.home.continue} →
                </Link>
              </div>
            )}

            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {recent.map((entry) => (
                <RecentRow key={entry.item.id} entry={entry} locale={locale} labels={labels} formatDate={formatDate} />
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label={labels.nav.areas} className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {AREAS.map((area) => {
          const soon = COMING_SOON_AREAS.includes(area);
          const areaStats = countSolved(
            items.filter((i) => i.area === area),
            solvedIds,
          );
          return (
            <Link
              key={area}
              href={`/${locale}/area/${area}`}
              className={`block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-blue-500/60 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                soon ? "opacity-60" : ""
              }`}
            >
              <h2 className="mb-3 flex items-center justify-between gap-2 font-medium">
                {labels.areas[area]}
                <span className="text-sm font-normal tabular-nums text-zinc-500">
                  {soon ? labels.home.soon : `${areaStats.solved}/${areaStats.total}`}
                </span>
              </h2>
              <ul className="space-y-1.5">
                {LEVELS.map((level) => {
                  const s = stats[area][level];
                  return (
                    <li key={level} className="flex items-center gap-3 text-xs">
                      <span className="w-20 shrink-0">{labels.levels[level]}</span>
                      <span className="flex-1">
                        <Bar stats={s} />
                      </span>
                      <span className="w-8 shrink-0 text-right tabular-nums text-zinc-500">
                        {s.solved}/{s.total}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function RecentRow({
  entry,
  locale,
  labels,
  formatDate,
}: {
  entry: RecentEntry;
  locale: Locale;
  labels: Labels;
  formatDate: (iso: string) => string;
}) {
  const { item, progress } = entry;
  const solved = isSolved(progress);

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
      <p className="min-w-0 flex-1 font-medium">
        {item.playable ? (
          <Link href={`/${locale}/exercise/${item.id}`} className="hover:underline">
            {item.title}
          </Link>
        ) : (
          item.title
        )}
        <span className="ml-2 text-xs font-normal text-zinc-500">
          {labels.areas[item.area]} · {labels.levels[item.level]}
        </span>
      </p>
      <span
        className={`rounded px-1.5 py-0.5 text-xs ${
          solved
            ? "bg-green-500/15 text-green-700 dark:text-green-400"
            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        }`}
      >
        {solved ? `✓ ${labels.home.solved}` : labels.home.inProgress}
      </span>
      <time dateTime={progress.updatedAt} className="text-xs tabular-nums text-zinc-500">
        {formatDate(progress.updatedAt)}
      </time>
    </li>
  );
}
