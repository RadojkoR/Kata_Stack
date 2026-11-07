import type { Metadata } from "next";
import Link from "next/link";
import { getExercises } from "@/lib/content";
import { getDictionary, getLocale, tagLabel } from "@/i18n/get-dictionary";
import { localize } from "@/i18n/localized";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.meta.title };
}

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const exercises = getExercises();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{dict.meta.title}</h1>
      <p className="mt-2 text-zinc-500">
        {dict.home.exercises}: {exercises.length}
      </p>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {exercises.map((e) => (
          <li key={e.id} className="py-4">
            {e.type === "classic" ? (
              <Link href={`/${locale}/exercise/${e.id}`} className="font-medium hover:underline">
                {localize(e.title, locale)}
              </Link>
            ) : (
              <p className="font-medium">{localize(e.title, locale)}</p>
            )}
            <p className="mt-1 text-sm text-zinc-500">
              {[dict.areas[e.area], dict.levels[e.level], dict.types[e.type], ...e.tags.map((t) => tagLabel(dict, t))].join(
                " · ",
              )}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
