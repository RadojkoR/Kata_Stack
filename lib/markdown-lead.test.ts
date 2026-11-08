import { describe, expect, it } from "vitest";
import { firstParagraph } from "./markdown-lead";

describe("firstParagraph", () => {
  it("vraća tekst do prve prazne linije", () => {
    expect(firstParagraph("Uvod.\n\n- a\n- b")).toBe("Uvod.");
  });

  it("jedan pasus vraća ceo, a razmake na krajevima uklanja", () => {
    expect(firstParagraph("  Samo jedan pasus.  \n")).toBe("Samo jedan pasus.");
  });

  it("tekst koji počinje listom vraća celu listu (nema uvoda)", () => {
    expect(firstParagraph("- a\n- b\n\nDrugi pasus")).toBe("- a\n- b");
  });

  it("prazan tekst daje prazan string", () => {
    expect(firstParagraph("")).toBe("");
  });
});
