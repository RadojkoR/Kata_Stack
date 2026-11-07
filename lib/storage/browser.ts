/** Storage koji ne puca kad localStorage nije dostupan (SSR, privatni prozor, blokirani podaci sajta). */
export type SafeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const memory = new Map<string, string>();

/** Sve se upisuje pod prefiksom `ks:`; ako localStorage ne radi, koristi se memorija do zatvaranja taba. */
export function createSafeStorage(prefix = "ks:"): SafeStorage {
  return {
    getItem(key) {
      try {
        return window.localStorage.getItem(prefix + key);
      } catch {
        return memory.get(prefix + key) ?? null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(prefix + key, value);
      } catch {
        memory.set(prefix + key, value);
      }
    },
    removeItem(key) {
      try {
        window.localStorage.removeItem(prefix + key);
      } catch {
        memory.delete(prefix + key);
      }
    },
  };
}
