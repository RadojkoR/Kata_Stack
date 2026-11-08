/** Prvi pasus teksta (do prve prazne linije). Koristi se kao kratak uvod uz korak objašnjenja. */
export function firstParagraph(text: string): string {
  return text.trim().split(/\n{2,}/)[0] ?? "";
}
