"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  availableTags,
  availableTypes,
  COMING_SOON_AREAS,
  countSolved,
  filterItems,
  levelStats,
  solvedSets,
  type BrowseItem,
  type Filter,
} from "@/lib/browse";
import { interpolate } from "@/lib/runner/messages";
import { useProgressMap } from "@/lib/storage/use-progress";
import { LEVELS, type Area } from "@/types/exercise";
import { Bar } from "./Bar";

type Props = {
  area: Area;
  /** Samo zadaci ove oblasti. */
  items: BrowseItem[];
  locale: string;
  labels: Pick<Dictionary, "areas" | "levels" | "types" | "tags" | "home">;
};

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    active
      ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
  }`;

/** Stranica oblasti: na vrhu napredak po nivoima, ispod lista zadataka sa filterima. */
export function AreaBrowser({ area, items, locale, labels }: Props) {
  const [filter, setFilter] = useState<Filter>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const progress = useProgressMap();

  const { solvedIds, helpedIds } = useMemo(() => solvedSets(progress), [progress]);
  const stats = useMemo(() => levelStats(items, solvedIds, helpedIds)[area], [items, solvedIds, helpedIds, area]);
  const total = countSolved(items, solvedIds, helpedIds);
  const soon = COMING_SOON_AREAS.includes(area);

  const shown = filterItems(items, filter);
  // Opcije za tip i temu se računaju iz zadataka koji ostaju kad se ne uzme u obzir sam taj filter.
  const types = availableTypes(filterItems(items, { ...filter, type: undefined }));
  const tags = availableTags(filterItems(items, { ...filter, tag: undefined }));
  const activeExtra = (filter.type ? 1 : 0) + (filter.tag ? 1 : 0);
  const hasFilter = activeExtra > 0 || Boolean(filter.level);

  const { home } = labels;
  const tagName = (tag: string) => (labels.tags as Record<string, string>)[tag] ?? tag;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{labels.areas[area]}</h1>
          {!soon && <p className="text-sm text-zinc-500">{interpolate(home.overall, total)}</p>}
        </div>

        {soon ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
            {home.soonPage}
          </p>
        ) : (
          <div role="group" aria-label={home.levelsTitle} className="grid gap-3 sm:grid-cols-3">
            {LEVELS.map((level) => {
              const s = stats[level];
              const active = filter.level === level;
              return (
                <button
                  key={level}
                  type="button"
                  disabled={s.total === 0}
                  aria-pressed={active}
                  aria-label={interpolate(home.cellLabel, {
                    area: labels.areas[area],
                    level: labels.levels[level],
                    solved: s.solved,
                    total: s.total,
                  })}
                  onClick={() => setFilter((f) => ({ ...f, level: active ? undefined : level }))}
                  className={`rounded-lg border p-3 text-left transition-colors disabled:opacity-50 ${
                    active
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-200 enabled:hover:bg-zinc-50 dark:border-zinc-800 enabled:dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">{labels.levels[level]}</span>
                    <span className="tabular-nums text-zinc-500">
                      {s.solved}/{s.total}
                    </span>
                  </span>
                  <Bar stats={s} thick />
                </button>
              );
            })}
          </div>
        )}
      </header>

      {!soon && (
        <section aria-label={home.exercises} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-lg font-semibold">
              {home.exercises}
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {interpolate(home.resultCount, { shown: shown.length, total: items.length })}
              </span>
            </h2>

            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              onClick={() => setFiltersOpen((o) => !o)}
              className={chip(filtersOpen || activeExtra > 0)}
            >
              {home.filtersTitle}
              {activeExtra > 0 && ` (${activeExtra})`}
            </button>

            {hasFilter && (
              <button
                type="button"
                onClick={() => setFilter({})}
                className="text-sm text-blue-600 underline underline-offset-2 dark:text-blue-400"
              >
                {home.clearFilters}
              </button>
            )}
          </div>

          {filtersOpen && (
            <div id="filters-panel" className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              {types.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-sm text-zinc-500">{home.filterType}</span>
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={filter.type === t}
                      onClick={() => setFilter((f) => ({ ...f, type: f.type === t ? undefined : t }))}
                      className={chip(filter.type === t)}
                    >
                      {labels.types[t]}
                    </button>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-sm text-zinc-500">{home.filterTag}</span>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={filter.tag === tag}
                      onClick={() => setFilter((f) => ({ ...f, tag: f.tag === tag ? undefined : tag }))}
                      className={chip(filter.tag === tag)}
                    >
                      {tagName(tag)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {shown.length === 0 ? (
            <p className="text-sm text-zinc-500">{home.noResults}</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {shown.map((e) => (
                <li key={e.id} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <p className="font-medium">
                    {e.playable ? (
                      <Link href={`/${locale}/exercise/${e.id}`} className="hover:underline">
                        {e.title}
                      </Link>
                    ) : (
                      e.title
                    )}
                    {solvedIds.has(e.id) && (
                      <span
                        title={helpedIds.has(e.id) ? home.solvedWithHelp : home.solved}
                        className={`ml-2 rounded px-1.5 py-0.5 text-xs font-normal ${
                          helpedIds.has(e.id)
                            ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                            : "bg-green-500/15 text-green-700 dark:text-green-400"
                        }`}
                      >
                        ✓
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {[labels.levels[e.level], ...e.tags.map(tagName)].join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
