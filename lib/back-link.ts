/**
 * Povratak sa radnog ekrana tamo odakle je korisnik došao. Stranica koja vodi na zadatak
 * dodaje `?from=<putanja>`; radni ekran je koristi za dugme "Nazad" i prosleđuje je dalje
 * na "Sledeći zadatak", pa se povratak ne gubi ni posle više zadataka zaredom.
 */

export function exerciseHref(locale: string, id: string, from?: string): string {
  const base = `/${locale}/exercise/${id}`;
  return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}

/** Prihvata samo putanje unutar sajta na istom jeziku (bez spoljnih adresa i `//`). */
export function safeFrom(locale: string, raw: string | string[] | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const root = `/${locale}`;
  const ok =
    (raw === root || raw.startsWith(`${root}/`) || raw.startsWith(`${root}?`)) &&
    !raw.includes("//") &&
    !raw.includes("\\") &&
    !/[\u0000-\u001f]/.test(raw);
  return ok ? raw : undefined;
}

/** Stranica oblasti sa izabranim nivoom; ista putanja se koristi kao `from` i kao podrazumevani povratak. */
export function areaHref(locale: string, area: string, level?: string): string {
  return `/${locale}/area/${area}${level ? `?level=${level}` : ""}`;
}
