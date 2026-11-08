import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Workspace } from "@/components/workspace/Workspace";
import { getDictionary, getLocale, tagLabel } from "@/i18n/get-dictionary";
import { localize } from "@/i18n/localized";
import { getExercise, getExercises } from "@/lib/content";
import { isPlayable } from "@/lib/runner/runtimes";

type Params = PageProps<"/[lang]/exercise/[id]">["params"];

// Radni ekran postoji samo za zadatke koje je moguće rešavati (vidi isPlayable).
export function generateStaticParams() {
  return getExercises()
    .filter(isPlayable)
    .map((e) => ({ id: e.id }));
}

// `params` se ne čita u samoj stranici nego unutar <Suspense>, da navigacija ostane "instant" (Cache Components).
export default function ExercisePage({ params }: PageProps<"/[lang]/exercise/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-[calc(100dvh-3rem)]" />}>
      <ExerciseContent params={params} />
    </Suspense>
  );
}

async function ExerciseContent({ params }: { params: Params }) {
  const { id } = await params;
  const exercise = getExercise(id);
  if (!exercise || exercise.type !== "classic" || !isPlayable(exercise)) notFound();

  const locale = await getLocale();
  const dict = await getDictionary();
  const title = localize(exercise.title, locale);

  return (
    <>
      {/* React 19 prebacuje <title> u <head>; zamena za generateMetadata, koji bi takođe čitao params */}
      <title>{`${title} · ${dict.meta.title}`}</title>
      <Workspace
        locale={locale}
        backHref={`/${locale}`}
        labels={dict.workspace}
        runnerLabels={dict.runner}
        exercise={{
          id: exercise.id,
          title,
          description: localize(exercise.description, locale),
          meta: [dict.areas[exercise.area], dict.levels[exercise.level], ...exercise.tags.map((t) => tagLabel(dict, t))],
          runtime: exercise.runtime,
          starterCode: exercise.starterCode,
          tests: exercise.tests,
          hiddenTests: exercise.hiddenTests,
          solutions: exercise.solutions.map((s) => ({
            label: localize(s.label, locale),
            code: s.code,
            note: s.note && localize(s.note, locale),
            steps: s.walkthrough?.map((w) => ({
              from: w.lines[0],
              to: w.lines[1],
              text: localize(w.text, locale),
            })),
          })),
        }}
      />
    </>
  );
}
