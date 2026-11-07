import { createSafeStorage } from "./browser";
import { createLocalStorageStore } from "./localStorageStore";
import type { ProgressStore } from "./ProgressStore";

export type { ProgressStore } from "./ProgressStore";

/** Događaj koji stranice slušaju da bi osvežile prikaz posle promene napretka u ovom tabu. */
export const PROGRESS_EVENT = "ks-progress";

let store: ProgressStore | undefined;

/**
 * Jedino mesto gde se bira implementacija. U Etapi 2 ovde ide `apiProgressStore`.
 * Poziva se samo iz klijentskog koda (event handleri i efekti).
 */
export function getProgressStore(): ProgressStore {
  store ??= createLocalStorageStore(
    createSafeStorage(),
    () => new Date(),
    () => window.dispatchEvent(new Event(PROGRESS_EVENT)),
  );
  return store;
}
