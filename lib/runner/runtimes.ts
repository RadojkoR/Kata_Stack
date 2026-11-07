import type { Runtime } from "@/types/exercise";

/** Okruženja za koja postoji adapter. `iframe-react` dolazi u Fazi 3, a `webcontainer` u Fazi 6. */
export const SUPPORTED_RUNTIMES: readonly Runtime[] = ["worker", "worker-ts", "types"];

/** Radni ekran postoji samo za klasične zadatke sa podržanim okruženjem; ostali tipovi dolaze u Fazi 4. */
export function isPlayable(exercise: { type: string; runtime: Runtime }): boolean {
  return exercise.type === "classic" && SUPPORTED_RUNTIMES.includes(exercise.runtime);
}
