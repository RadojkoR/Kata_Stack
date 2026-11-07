import type { Metadata } from "next";
import { Overview } from "@/components/home/Overview";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { toBrowseItem } from "@/lib/browse";
import { getExercises } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.meta.title };
}

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary();
  const items = getExercises().map((e) => toBrowseItem(e, locale));

  return (
    <main>
      <Overview
        items={items}
        locale={locale}
        labels={{ areas: dict.areas, levels: dict.levels, home: dict.home, nav: dict.nav }}
      />
    </main>
  );
}
