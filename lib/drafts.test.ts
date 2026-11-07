import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "./drafts";
import type { SafeStorage } from "./storage/browser";

function fakeStorage(): SafeStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe("drafts", () => {
  let storage: ReturnType<typeof fakeStorage>;
  beforeEach(() => {
    storage = fakeStorage();
  });

  it("čuva i vraća kod pod ključem v1:draft:<id>", () => {
    saveDraft(storage, "sum-01", "const a = 1;");
    expect([...storage.data.keys()]).toEqual(["v1:draft:sum-01"]);
    expect(loadDraft(storage, "sum-01")).toBe("const a = 1;");
  });

  it("nacrti različitih zadataka se ne mešaju", () => {
    saveDraft(storage, "a", "A");
    saveDraft(storage, "b", "B");
    expect(loadDraft(storage, "a")).toBe("A");
    expect(loadDraft(storage, "b")).toBe("B");
  });

  it("vraća null kad nacrta nema i posle brisanja", () => {
    expect(loadDraft(storage, "x")).toBeNull();
    saveDraft(storage, "x", "kod");
    clearDraft(storage, "x");
    expect(loadDraft(storage, "x")).toBeNull();
  });

  it("oštećen nacrt se preskače uz upozorenje, bez izuzetka", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.setItem("v1:draft:bad", "{nije json");
    storage.setItem("v1:draft:shape", JSON.stringify({ code: 5 }));
    expect(loadDraft(storage, "bad")).toBeNull();
    expect(loadDraft(storage, "shape")).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
