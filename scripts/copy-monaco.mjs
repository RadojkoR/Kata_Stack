// Kopira instalirani Monaco u public/monaco, da se editor servira sa našeg sajta (bez CDN-a)
// i da verzija uvek odgovara instaliranom paketu. Pokreće se pre `dev` i `build`.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const src = "node_modules/monaco-editor/min/vs";
const dest = "public/monaco/vs";
const stamp = "public/monaco/.version";

if (!existsSync(src)) {
  console.error("monaco-editor nije instaliran. Pokreni `npm install`.");
  process.exit(1);
}

const version = JSON.parse(readFileSync("node_modules/monaco-editor/package.json", "utf8")).version;
if (existsSync(dest) && existsSync(stamp) && readFileSync(stamp, "utf8") === version) process.exit(0);

mkdirSync("public/monaco", { recursive: true });
cpSync(src, dest, { recursive: true, force: true });
writeFileSync(stamp, version);
console.log(`Monaco ${version} kopiran u ${dest}`);
