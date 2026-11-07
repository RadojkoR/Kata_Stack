import { describe, expect, it } from "vitest";
import { getExercises } from "@/lib/content";
import { defaultLocale, hasLocale, locales } from "./config";
import en from "./dictionaries/en.json";
import sr from "./dictionaries/sr.json";
import { LocalizedStringSchema, localize } from "./localized";
import { resolveLocale } from "./negotiate";

function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("rečnici", () => {
  it("sr i en imaju tačno iste ključeve", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(sr).sort());
  });

  it("nijedna vrednost nije prazna", () => {
    for (const dict of [sr, en]) {
      for (const path of keyPaths(dict)) {
        const value = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], dict);
        expect(String(value).trim(), path).not.toBe("");
      }
    }
  });

  it("svaki tag iz zadataka ima naziv u oba rečnika", () => {
    const tags = new Set(getExercises().flatMap((e) => e.tags));
    for (const tag of tags) {
      expect(sr.tags, `sr: ${tag}`).toHaveProperty(tag);
      expect(en.tags, `en: ${tag}`).toHaveProperty(tag);
    }
  });
});

describe("config", () => {
  it("hasLocale prepoznaje samo podržane jezike", () => {
    expect(locales).toEqual(["sr", "en"]);
    expect(hasLocale("sr")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("de")).toBe(false);
    expect(hasLocale(undefined)).toBe(false);
  });
});

describe("localized", () => {
  it("localize bira tekst po jeziku", () => {
    const v = LocalizedStringSchema.parse({ sr: "zdravo", en: "hello" });
    expect(localize(v, "sr")).toBe("zdravo");
    expect(localize(v, "en")).toBe("hello");
  });

  it("odbija tekst kome fali jezik ili ima prazan jezik", () => {
    expect(LocalizedStringSchema.safeParse({ sr: "samo" }).success).toBe(false);
    expect(LocalizedStringSchema.safeParse({ sr: "a", en: "" }).success).toBe(false);
  });
});

describe("resolveLocale", () => {
  it("cookie ima prednost nad Accept-Language", () => {
    expect(resolveLocale({ cookie: "en", acceptLanguage: "sr-RS,sr;q=0.9" })).toBe("en");
    expect(resolveLocale({ cookie: "sr", acceptLanguage: "en-US,en;q=0.9" })).toBe("sr");
  });

  it("nevažeći cookie se ignoriše", () => {
    expect(resolveLocale({ cookie: "de", acceptLanguage: "en-US" })).toBe("en");
  });

  it("bira jezik iz Accept-Language", () => {
    expect(resolveLocale({ acceptLanguage: "en-US,en;q=0.9" })).toBe("en");
    expect(resolveLocale({ acceptLanguage: "en-GB" })).toBe("en");
    expect(resolveLocale({ acceptLanguage: "sr-RS,sr;q=0.9,en;q=0.5" })).toBe("sr");
    expect(resolveLocale({ acceptLanguage: "de-DE,de;q=0.9,en;q=0.5" })).toBe("en");
  });

  it("podrazumevani jezik kad nema podržanog ili je zaglavlje neispravno", () => {
    expect(resolveLocale({})).toBe(defaultLocale);
    expect(resolveLocale({ acceptLanguage: "fr-FR,fr;q=0.9" })).toBe(defaultLocale);
    expect(resolveLocale({ acceptLanguage: "*" })).toBe(defaultLocale);
    expect(resolveLocale({ acceptLanguage: ";;;" })).toBe(defaultLocale);
  });
});
