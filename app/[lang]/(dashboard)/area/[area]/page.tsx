import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AreaBrowser } from "@/components/home/AreaBrowser";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { toBrowseItem } from "@/lib/browse";
import { getExercises } from "@/lib/content";
import { AREAS, AreaSchema, LevelSchema } from "@/types/exercise";

type Params = PageProps<"/[lang]/area/[area]">["params"];

export function generateStaticParams() {
  return AREAS.map((area) => ({ area }));
}

// `params` se ne čita u samoj stranici nego unutar <Suspense>, da navigacija ostane "instant" (Cache Components).
export default function AreaPage({ params, searchParams }: PageProps<"/[lang]/area/[area]">) {
  return (
    <main>
      <Suspense fallback={<div aria-busy className="h-64" />}>
        <AreaContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AreaContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: PageProps<"/[lang]/area/[area]">["searchParams"];
}) {
  const parsed = AreaSchema.safeParse((await params).area);
  if (!parsed.success) notFound();
  const area = parsed.data;

  // Izabrani nivo je u adresi (?level=), da se pri povratku sa zadatka lista otvori na istom nivou.
  const level = LevelSchema.safeParse((await searchParams).level);
  const locale = await getLocale();
  const dict = await getDictionary();
  const items = getExercises()
    .filter((e) => e.area === area)
    .map((e) => toBrowseItem(e, locale));

  return (
    <>
      <title>{`${dict.areas[area]} · ${dict.meta.title}`}</title>
      <AreaBrowser
        area={area}
        initialLevel={level.success ? level.data : undefined}
        items={items}
        locale={locale}
        labels={{ areas: dict.areas, levels: dict.levels, types: dict.types, tags: dict.tags, home: dict.home }}
      />
    </>
  );
}
