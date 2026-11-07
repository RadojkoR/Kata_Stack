import { describe, expect, it } from "vitest";
import { buildCatalog, ContentError, parseExerciseFile, parseTrackFile } from "./catalog";

const classic = {
  id: "sum-01",
  title: { sr: "Zbir", en: "Sum" },
  type: "classic",
  area: "javascript",
  level: "pocetnik",
  runtime: "worker",
  tags: ["nizovi"],
  description: { sr: "opis", en: "description" },
  starterCode: "function sum() {}",
  tests: "test('x', () => {});",
  solutions: [{ label: { sr: "a", en: "a" }, code: "function sum() {}" }],
};

const raw = (o: unknown) => JSON.stringify(o);

describe("parseExerciseFile", () => {
  it("prihvata ispravan zadatak", () => {
    const e = parseExerciseFile("javascript/pocetnik/sum-01.json", raw(classic));
    expect(e.id).toBe("sum-01");
  });

  it("odbija nevalidan JSON uz ime fajla", () => {
    expect(() => parseExerciseFile("javascript/pocetnik/x.json", "{ nije json")).toThrow(/x\.json.*nije validan JSON/);
  });

  it("navodi polje koje nedostaje", () => {
    const bez: Partial<typeof classic> = { ...classic };
    delete bez.tests;
    expect(() => parseExerciseFile("javascript/pocetnik/sum-01.json", raw(bez))).toThrow(/tests/);
  });

  it("odbija nepoznatu oblast ili nivo", () => {
    expect(() =>
      parseExerciseFile("javascript/pocetnik/sum-01.json", raw({ ...classic, area: "python" })),
    ).toThrow(ContentError);
    expect(() =>
      parseExerciseFile("javascript/pocetnik/sum-01.json", raw({ ...classic, level: "lak" })),
    ).toThrow(ContentError);
  });

  it("odbija zadatak kome fali jedan jezik", () => {
    const samoSrpski = { ...classic, title: { sr: "Zbir" } };
    expect(() => parseExerciseFile("javascript/pocetnik/sum-01.json", raw(samoSrpski))).toThrow(/title\.en/);
  });

  it("odbija običan string tamo gde treba tekst na oba jezika", () => {
    expect(() =>
      parseExerciseFile("javascript/pocetnik/sum-01.json", raw({ ...classic, description: "samo srpski" })),
    ).toThrow(/description/);
  });

  it("odbija nepoznata polja (greška u kucanju)", () => {
    expect(() => parseExerciseFile("javascript/pocetnik/sum-01.json", raw({ ...classic, hiddenTest: "x" }))).toThrow(
      /hiddenTest/,
    );
  });

  it("odbija id sa velikim slovima ili razmacima", () => {
    expect(() => parseExerciseFile("javascript/pocetnik/a.json", raw({ ...classic, id: "Sum 01" }))).toThrow(/id/);
  });

  it("odbija fajl u pogrešnom folderu", () => {
    expect(() => parseExerciseFile("typescript/pocetnik/sum-01.json", raw(classic))).toThrow(/folder/);
    expect(() => parseExerciseFile("javascript/srednji/sum-01.json", raw(classic))).toThrow(/folder/);
  });

  it("prepoznaje bug-hunt zadatak", () => {
    const bug = {
      id: "bug-01",
      title: { sr: "Bag", en: "Bug" },
      type: "bug-hunt",
      area: "javascript",
      level: "srednji",
      runtime: "worker",
      context: { sr: "AI je napisao ovo", en: "An AI wrote this" },
      buggyCode: "forEach(async () => {})",
      tests: "test('x', () => {});",
      bugExplanation: { sr: "forEach ne čeka", en: "forEach does not wait" },
    };
    expect(parseExerciseFile("javascript/srednji/bug-01.json", raw(bug)).type).toBe("bug-hunt");
  });
});

describe("buildCatalog", () => {
  const ex = (id: string) => parseExerciseFile(`javascript/pocetnik/${id}.json`, raw({ ...classic, id }));

  it("odbija dupliran id zadatka", () => {
    expect(() =>
      buildCatalog(
        [
          { file: "javascript/pocetnik/a.json", exercise: ex("sum-01") },
          { file: "javascript/pocetnik/b.json", exercise: ex("sum-01") },
        ],
        [],
      ),
    ).toThrow(/Dupliran id.*sum-01/);
  });

  it("odbija stazu koja pokazuje na nepostojeći zadatak", () => {
    const track = parseTrackFile("async.json", raw({ id: "async", title: { sr: "Async", en: "Async" }, exercises: ["sum-01", "nema-ga"] }));
    expect(() =>
      buildCatalog([{ file: "javascript/pocetnik/a.json", exercise: ex("sum-01") }], [{ file: "async.json", track }]),
    ).toThrow(/nema-ga/);
  });

  it("prihvata ispravan skup", () => {
    const track = parseTrackFile("t.json", raw({ id: "t", title: { sr: "T", en: "T" }, exercises: ["sum-01"] }));
    const catalog = buildCatalog([{ file: "javascript/pocetnik/a.json", exercise: ex("sum-01") }], [
      { file: "t.json", track },
    ]);
    expect(catalog.exercises).toHaveLength(1);
    expect(catalog.tracks).toHaveLength(1);
  });
});
