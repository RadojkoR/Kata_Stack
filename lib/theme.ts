/** Deo teme koji sme da se uveze i na serveru (bez React hook-ova). Hook je u `use-theme.ts`. */

export type Theme = "dark" | "light";
export const DEFAULT_THEME: Theme = "dark";

/** Ključ `ks:ui` u localStorage-u; storage dodaje prefiks `ks:`. */
export const UI_STORAGE_KEY = "ui";

/**
 * Skripta za `<head>` koja postavlja temu pre prvog iscrtavanja, da nema treptanja.
 * Mora da čita isti ključ i oblik kao `readTheme` u `use-theme.ts`.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var u=JSON.parse(localStorage.getItem("ks:${UI_STORAGE_KEY}")||"{}");if(u.theme==="light"||u.theme==="dark")document.documentElement.setAttribute("data-theme",u.theme)}catch(e){}})()`;
