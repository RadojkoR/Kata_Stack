import { describe, expect, it } from "vitest";
import { areaHref, exerciseHref, safeFrom } from "./back-link";

describe("back-link", () => {
  it("exerciseHref dodaje from samo kad postoji", () => {
    expect(exerciseHref("sr", "a-01")).toBe("/sr/exercise/a-01");
    expect(exerciseHref("sr", "a-01", "/sr/area/javascript?level=pocetnik")).toBe(
      "/sr/exercise/a-01?from=%2Fsr%2Farea%2Fjavascript%3Flevel%3Dpocetnik",
    );
  });

  it("safeFrom prihvata putanje na istom jeziku", () => {
    expect(safeFrom("sr", "/sr")).toBe("/sr");
    expect(safeFrom("sr", "/sr/area/javascript?level=pocetnik")).toBe("/sr/area/javascript?level=pocetnik");
  });

  it("safeFrom odbija spoljne i sumnjive adrese", () => {
    expect(safeFrom("sr", "https://evil.example")).toBeUndefined();
    expect(safeFrom("sr", "//evil.example")).toBeUndefined();
    expect(safeFrom("sr", "/sr//evil.example")).toBeUndefined();
    expect(safeFrom("sr", "/sr\\evil")).toBeUndefined();
    expect(safeFrom("sr", "/en/area/javascript")).toBeUndefined();
    expect(safeFrom("sr", "/srx")).toBeUndefined();
    expect(safeFrom("sr", undefined)).toBeUndefined();
    expect(safeFrom("sr", ["/sr"])).toBeUndefined();
  });

  it("areaHref", () => {
    expect(areaHref("en", "node")).toBe("/en/area/node");
    expect(areaHref("en", "node", "srednji")).toBe("/en/area/node?level=srednji");
  });
});
