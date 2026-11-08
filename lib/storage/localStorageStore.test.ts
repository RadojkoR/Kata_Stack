import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SafeStorage } from "./browser";
import { exportFileName, parseExportFile, summarizeExport } from "./exportImport";
import { ATTEMPTS_KEY, createLocalStorageStore, PROGRESS_KEY } from "./localStorageStore";
import type { NewAttempt } from "./ProgressStore";

function fakeStorage(): SafeStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

let tick: number;
const clock = () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++));

const submit = (over: Partial<NewAttempt> = {}): NewAttempt => ({
  exerciseId: "sum-01",
  kind: "submit",
  passed: true,
  durationMs: 45_000,
  code: "function sum() {}",
  ...over,
});

describe("localStorageStore", () => {
  let storage: ReturnType<typeof fakeStorage>;
  let notified: number;
  let store: ReturnType<typeof createLocalStorageStore>;

  beforeEach(() => {
    tick = 0;
    notified = 0;
    storage = fakeStorage();
    store = createLocalStorageStore(storage, clock, () => notified++);
  });

  it("prazan store: nema napretka ni pokušaja", async () => {
    expect(await store.get("x")).toBeNull();
    expect(await store.getAll()).toEqual({});
    expect(await store.getAttempts("x")).toEqual([]);
  });

  it("uspešan Submit upisuje rešen zadatak pod ključevima v1:progress i v1:attempts", async () => {
    const p = await store.recordAttempt(submit());
    expect(p).toMatchObject({ exerciseId: "sum-01", status: "solved", bestTimeMs: 45_000 });
    expect(p.solvedAt).toBeDefined();
    expect([...storage.data.keys()].sort()).toEqual([ATTEMPTS_KEY, PROGRESS_KEY].sort());
    expect((await store.get("sum-01"))?.status).toBe("solved");
    expect(notified).toBe(1);
  });

  it("Run ne rešava zadatak, ali se beleži kao pokušaj", async () => {
    await store.recordAttempt(submit({ kind: "run" }));
    expect((await store.get("sum-01"))?.status).toBe("in_progress");
    expect(await store.getAttempts("sum-01")).toHaveLength(1);
  });

  it("čuva najviše 20 pokušaja po zadatku", async () => {
    for (let i = 0; i < 25; i++) await store.recordAttempt(submit({ passed: false, code: `v${i}` }));
    const attempts = await store.getAttempts("sum-01");
    expect(attempts).toHaveLength(20);
    expect(attempts[0].code).toBe("v5");
    expect(attempts.at(-1)?.code).toBe("v24");
  });

  it("beleške se čuvaju uz zadatak i ne diraju status", async () => {
    await store.saveNotes("sum-01", "zaboravio sam na prazan niz");
    const p = await store.get("sum-01");
    expect(p?.notes).toBe("zaboravio sam na prazan niz");
    expect(p?.status).toBe("in_progress");

    await store.recordAttempt(submit());
    expect((await store.get("sum-01"))?.notes).toBe("zaboravio sam na prazan niz");
  });

  it("prazne beleške brišu polje, a bez zapisa ne prave novi", async () => {
    await store.saveNotes("nema", "");
    expect(await store.get("nema")).toBeNull();

    await store.saveNotes("sum-01", "x");
    await store.saveNotes("sum-01", "");
    expect((await store.get("sum-01"))?.notes).toBeUndefined();
  });

  it("otvaranje rešenja pre rešavanja daje solved_with_help, a posle rešavanja ništa ne menja", async () => {
    const viewed = await store.markSolutionViewed("sum-01");
    expect(viewed).toMatchObject({ status: "in_progress", hintLevel: 3 });

    const solved = await store.recordAttempt(submit());
    expect(solved.status).toBe("solved_with_help");

    // zadatak rešen samostalno: otvaranje rešenja ga ne "snižava"
    await store.recordAttempt(submit({ exerciseId: "b" }));
    const after = await store.markSolutionViewed("b");
    expect(after.status).toBe("solved");
    expect(after.hintLevel).toBe(0);
  });

  it("oštećeni zapisi se preskaču uz upozorenje, a kopija se čuva", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.setItem(PROGRESS_KEY, JSON.stringify({ a: { nije: "validan zapis" } }));
    expect(await store.getAll()).toEqual({});
    expect(storage.getItem(`${PROGRESS_KEY}:corrupt`)).toContain("validan zapis");
    expect(warn).toHaveBeenCalled();

    storage.setItem(ATTEMPTS_KEY, "{nije json");
    expect(await store.getAttempts("a")).toEqual([]);
    warn.mockRestore();
  });

  describe("izvoz i uvoz", () => {
    async function seed() {
      await store.recordAttempt(submit({ exerciseId: "a", durationMs: 30_000 }));
      await store.recordAttempt(submit({ exerciseId: "b", passed: false }));
      await store.saveNotes("b", "beleška");
    }

    it("izvoz → brisanje → uvoz daje iste podatke", async () => {
      await seed();
      const before = await store.exportAll();

      storage.data.clear(); // kao da su obrisani podaci sajta
      expect((await store.exportAll()).progress).toEqual([]);

      const count = await store.importAll(before, "replace");
      const after = await store.exportAll();

      expect(count).toBe(2);
      expect(after.progress).toEqual(before.progress);
      expect(after.attempts).toEqual(before.attempts);
    });

    it("izvezeni fajl prolazi proveru uvoza i ima verziju 1", async () => {
      await seed();
      const text = JSON.stringify(await store.exportAll());
      const parsed = parseExportFile(text);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.data.version).toBe(1);
        expect(summarizeExport(parsed.data)).toEqual({ exercises: 2, solved: 1, attempts: 2 });
      }
    });

    it("replace briše ono čega nema u fajlu, merge to zadržava", async () => {
      await seed();
      const snapshot = await store.exportAll();
      await store.recordAttempt(submit({ exerciseId: "c" })); // postoji samo lokalno

      await store.importAll(snapshot, "merge");
      expect(Object.keys(await store.getAll()).sort()).toEqual(["a", "b", "c"]);

      await store.importAll(snapshot, "replace");
      expect(Object.keys(await store.getAll()).sort()).toEqual(["a", "b"]);
    });

    it("merge: noviji zapis pobeđuje, bez obzira da li je u fajlu ili lokalno", async () => {
      await seed();
      const old = await store.exportAll();
      await store.recordAttempt(submit({ exerciseId: "b" })); // lokalno novije: b je sada rešen

      await store.importAll(old, "merge");
      expect((await store.get("b"))?.status).toBe("solved");
    });

    it("uvoz odbija neispravne podatke i ništa ne menja", async () => {
      await seed();
      const before = await store.exportAll();
      await expect(store.importAll({ version: 2 } as never, "replace")).rejects.toThrow();
      const after = await store.exportAll();
      expect(after.progress).toEqual(before.progress);
      expect(after.attempts).toEqual(before.attempts);
    });
  });
});

describe("parseExportFile", () => {
  it("odbija loš JSON, pogrešnu verziju i nepoznata polja, uz razlog", () => {
    expect(parseExportFile("{nije json")).toEqual({ ok: false, reason: "JSON" });

    const wrongVersion = parseExportFile(JSON.stringify({ version: 2, exportedAt: "x", progress: [], attempts: [] }));
    expect(wrongVersion.ok).toBe(false);
    if (!wrongVersion.ok) expect(wrongVersion.reason).toContain("version");

    const extra = parseExportFile(
      JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), progress: [], attempts: [], x: 1 }),
    );
    expect(extra.ok).toBe(false);
  });

  it("ime fajla sadrži datum", () => {
    expect(exportFileName(new Date("2026-03-09T12:00:00Z"))).toBe("kata-stack-2026-03-09.json");
  });
});
