import { Sidebar } from "@/components/layout/Sidebar";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { getExercises } from "@/lib/content";
import { AREAS } from "@/types/exercise";

/** Stranice sa bočnim menijem (pregled, oblasti, podešavanja). Radni ekran je van ove grupe: treba mu cela širina. */
export default async function DashboardLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();
  const exercises = getExercises();

  const areas = AREAS.map((area) => ({
    area,
    ids: exercises.filter((e) => e.area === area).map((e) => e.id),
  }));

  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      <Sidebar locale={locale} areas={areas} labels={{ areas: dict.areas, nav: dict.nav }} />
      <div className="min-w-0 flex-1 px-4 py-8 md:px-8">{children}</div>
    </div>
  );
}
