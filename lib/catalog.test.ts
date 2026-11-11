import { describe, expect, it } from "vitest";
import { buildCatalog, ContentError, parseExerciseFile, parseOrderFile, parseTrackFile } from "./catalog";

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

describe("objašnjenje rešenja po linijama", () => {
  const step = (from: number, to: number) => ({ lines: [from, to], text: { sr: "t", en: "t" } });
  const withWalkthrough = (code: string, walkthrough: unknown) => ({
    ...classic,
    solutions: [{ label: { sr: "a", en: "a" }, code, walkthrough }],
  });
  const parse = (code: string, walkthrough: unknown) =>
    parseExerciseFile("javascript/pocetnik/sum-01.json", raw(withWalkthrough(code, walkthrough)));

  const code = "function f() {\n  return 1;\n\n}";

  it("prihvata potpuno objašnjenje; prazne linije ne moraju da budu pokrivene", () => {
    expect(() => parse(code, [step(1, 2), step(4, 4)])).not.toThrow();
  });

  it("opsezi mogu da se preklapaju (isti red objašnjen na dva mesta)", () => {
    expect(() => parse(code, [step(1, 2), step(2, 2), step(4, 4)])).not.toThrow();
  });

  it("odbija objašnjenje kome fali linija koja nije prazna, uz brojeve linija", () => {
    expect(() => parse(code, [step(1, 1), step(4, 4)])).toThrow(/nema objašnjenja za linije: 2/);
    expect(() => parse(code, [step(1, 2)])).toThrow(/nema objašnjenja za linije: 4/);
  });

  it("odbija opseg koji izlazi iz koda ili ide unazad", () => {
    expect(() => parse(code, [step(1, 9)])).toThrow(/ne postoji/);
    expect(() => parse(code, [step(3, 2)])).toThrow(/unazad/);
  });

  it("odbija objašnjenje kome fali jedan jezik i opseg sa nulom", () => {
    const oneLanguage = [{ lines: [1, 4], text: { sr: "samo srpski" } }];
    expect(() => parse(code, oneLanguage)).toThrow(/text\.en/);
    expect(() => parse(code, [step(0, 4)])).toThrow(ContentError);
  });

  it("objašnjenje je opciono: rešenje bez njega prolazi", () => {
    expect(() => parseExerciseFile("javascript/pocetnik/sum-01.json", raw(classic))).not.toThrow();
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

describe("redosled zadataka", () => {
  const ex = (id: string, level = "pocetnik", area = "javascript") =>
    parseExerciseFile(`${area}/${level}/${id}.json`, raw({ ...classic, id, level, area }));
  const file = (id: string, level = "pocetnik", area = "javascript") => ({
    file: `${area}/${level}/${id}.json`,
    exercise: ex(id, level, area),
  });
  const order = (json: unknown, name = "javascript.json") => ({ file: name, ...parseOrderFile(name, raw(json)) });
  const ids = (c: { exercises: { id: string }[] }) => c.exercises.map((e) => e.id);

  it("bez fajla redosleda zadaci ostaju po redosledu fajlova", () => {
    const c = buildCatalog([file("b-01"), file("a-01")], []);
    expect(ids(c)).toEqual(["b-01", "a-01"]);
  });

  it("slaže po oblasti, nivou i mestu u fajlu redosleda", () => {
    const c = buildCatalog(
      [
        file("t-01", "pocetnik", "typescript"),
        file("e-01", "expert"),
        file("b-01"),
        file("a-01"),
        file("m-01", "srednji"),
      ],
      [],
      [order({ pocetnik: ["a-01", "b-01"], srednji: ["m-01"], expert: ["e-01"] })],
    );
    expect(ids(c)).toEqual(["a-01", "b-01", "m-01", "e-01", "t-01"]);
  });

  it("zadaci oblasti bez fajla redosleda idu iza i ostaju po abecedi", () => {
    const c = buildCatalog(
      [file("z-01"), file("y-01", "pocetnik", "typescript"), file("x-01", "pocetnik", "typescript")],
      [],
      [order({ pocetnik: ["z-01"] })],
    );
    expect(ids(c)).toEqual(["z-01", "y-01", "x-01"]);
  });

  it("odbija id koji ne postoji", () => {
    expect(() => buildCatalog([file("a-01")], [], [order({ pocetnik: ["a-01", "nema-01"] })])).toThrow(/nema-01/);
  });

  it("odbija id koji je u pogrešnom nivou ili oblasti", () => {
    expect(() => buildCatalog([file("a-01", "srednji")], [], [order({ pocetnik: ["a-01"] })])).toThrow(/nivoa pocetnik/);
    expect(() => buildCatalog([file("a-01", "pocetnik", "typescript")], [], [order({ pocetnik: ["a-01"] })])).toThrow(
      /oblasti javascript/,
    );
  });

  it("odbija id naveden dvaput", () => {
    expect(() => buildCatalog([file("a-01")], [], [order({ pocetnik: ["a-01", "a-01"] })])).toThrow(/više puta/);
    expect(() =>
      buildCatalog([file("a-01"), file("b-01", "srednji")], [], [order({ pocetnik: ["a-01"], srednji: ["b-01", "a-01"] })]),
    ).toThrow(/više puta/);
  });

  it("odbija zadatak oblasti koja ima fajl redosleda, a nije upisan", () => {
    expect(() => buildCatalog([file("a-01"), file("b-01")], [], [order({ pocetnik: ["a-01"] })])).toThrow(
      /nisu upisani u redosled: b-01/,
    );
  });

  it("fajl redosleda mora imati ime oblasti i poznate nivoe", () => {
    expect(() => parseOrderFile("python.json", "{}")).toThrow(/ime fajla/);
    expect(() => parseOrderFile("javascript.json", raw({ lak: [] }))).toThrow(ContentError);
    expect(() => parseOrderFile("javascript.json", raw({ pocetnik: ["Veliko Slovo"] }))).toThrow(/pocetnik/);
  });
});
