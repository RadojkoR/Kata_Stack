import { getExercises } from "@/lib/content";
import { AREA_LABELS, LEVEL_LABELS } from "@/types/exercise";

export default function Home() {
  const exercises = getExercises();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Kata Stack</h1>
      <p className="mt-2 text-zinc-500">Zadaci: {exercises.length}</p>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {exercises.map((e) => (
          <li key={e.id} className="py-4">
            <p className="font-medium">{e.title}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {AREA_LABELS[e.area]} · {LEVEL_LABELS[e.level]} · {e.type}
              {e.tags.length > 0 && ` · ${e.tags.join(", ")}`}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
