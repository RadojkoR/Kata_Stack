import { percent, type Stats } from "@/lib/browse";

/** Traka napretka. Ukrasna je (`aria-hidden`): tekst pored nje nosi isti podatak, pa je ne čitaju čitači ekrana. */
export function Bar({ stats, thick = false }: { stats: Stats; thick?: boolean }) {
  return (
    <span
      aria-hidden
      className={`block w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800 ${thick ? "h-2" : "h-1"}`}
    >
      <span className="block h-full bg-green-500" style={{ width: `${percent(stats)}%` }} />
    </span>
  );
}
