# Plan: 40 novih JavaScript zadataka za nivo „početnik“

> Dopuna dokumenata [plan-js-platforma.md](plan-js-platforma.md) i [koraci-za-programiranje.md](koraci-za-programiranje.md). Ovaj dokument beleži dogovor, pravila i stanje rada, da se nastavi bez ponovnog objašnjavanja.
>
> Stanje na dan 2026-11-07.

---

## 1. Cilj

- Dodati **40 novih** zadataka za nivo `pocetnik` (uz postojećih 10, ukupno 50).
- Zadaci su JavaScript, `runtime: "worker"`, `type: "classic"`.
- Rade se u grupama od 5 zadataka. Posle svake grupe: spisak (id, naslov, tema, broj rešenja) i rezultat `npm test`, pa potvrda korisnika pre sledeće grupe.

**Širi kontekst:**
- Srednji nivo (4: debounce, memoize, promise-all, flatten) i expert (1: curry) su gotovi iz ranijeg dogovora (10 početnih + 4 srednja + 1 expert).
- React/Next.js zadaci nisu rađeni. Čekaju okruženje `iframe-react` (Faza 3).

---

## 2. Raspored tema (10 tema × 4 zadatka)

| # | Tema |
|---|---|
| 1 | Varijable i tipovi podataka (`typeof`, konverzije) |
| 2 | Operatori i uslovi (`if/else`, ternarni, `switch`) |
| 3 | Petlje (`for`, `while`, `for...of`) |
| 4 | Stringovi (`slice`, `includes`, `split`, `padStart`, šablon-literali) |
| 5 | Nizovi osnovno (`indexOf`, `includes`, `slice`, spread) |
| 6 | Metode nizova (`map`, `filter`, `find`, `some`, `every`, `reduce`) |
| 7 | Objekti (pristup, `Object.keys/values/entries`, spread) |
| 8 | Funkcije (podrazumevane vrednosti, rest parametri, arrow funkcije) |
| 9 | Math i brojevi (zaokruživanje, `min/max`, `Number.isNaN`); bez decimalnih rezultata koji traže približno poređenje |
| 10 | Mini zadaci koji kombinuju više tema |

---

## 3. Pravila za svaki zadatak

**Dogovoreno na početku:**
- Fajl: `content/exercises/javascript/pocetnik/<id>.json`. Id malim slovima sa crticama i sufiksom `-01`.
- Sav tekst na oba jezika: `title`, `description`, nazivi vidljivih i skrivenih testova, `label` i `note` svakog rešenja, i svaki korak `walkthrough`-a. Srpski latinicom.
- Opis sa 2–3 primera ulaza i izlaza i ograničenjima, kao u `sum-evens-01`.
- `starterCode`: potpis funkcije i `// your code`.
- 2–3 vidljiva testa sa dvojezičnim nazivima. 2–4 skrivena testa sa engleskim nazivima za granične slučajeve (prazan niz ili string, `0`, negativni brojevi, neizmenjen ulaz).
- Rešenja: dva kada postoji stvarna razlika u pristupu (npr. petlja naspram metode niza), inače jedno. Svako sa `note`-om.
- `walkthrough` za svako rešenje: svaka linija koja nije prazna, na oba jezika, na nivou početnika. Objasniti svaki deo sintakse. Za petlje i `reduce` dodati tabelu koraka.
- Tagovi su engleski slug-ovi. Novi tag se dodaje u `sr.json` i `en.json`.

**Dodato tokom pregleda prve dve grupe (važi od sada):**
- **Opis mora da kaže sve što skriveni test proverava** (emoji, `NaN`, `1` naspram `'1'`, opseg ulaza, granične vrednosti). Ponašanje koje nije u opisu ne sme biti jedini razlog za pad testa.
- **Zabrana koja se ne može proveriti pretvara se u preporuku.** Primer: „reši bez `Math.max`“, jer testovi proveravaju samo rezultat.
- **Pre predaje pokrenuti bar jedno „skoro ispravno“ rešenje** i zapisati očekivani ishod. Ako neko pogrešno rešenje prođe, popraviti test ili opis.
- **Tvrdnje iz objašnjenja izvršiti u Node-u**, ne samo pročitati. Ovo važi za JavaScript ponašanje. TypeScript tipove proveravati kroz testove.
- **Svaki pomen broja linije u objašnjenju proveriti**: ta linija mora zaista da sadrži `{`, `}` ili ono što se tvrdi.
- **sr i en moraju značiti isto.** Kod i tabele toka su isti u oba jezika.
- **Korisni „trap“-ovi u objašnjenjima** su dobrodošli. Primeri: `slice(-0)`, `indexOf` vraća `0` za početak, `''.split(',')` daje `['']`, `NaN !== NaN`.

---

## 4. Postupak po grupi

1. Napisati skriptu za grupu (generiše JSON iz strukture: opis, testovi, rešenja, walkthrough).
2. `npm test`: rešenja prolaze, početni kod pada, walkthrough je potpun, tagovi imaju prevod.
3. `npx tsc --noEmit` i `npm run lint`.
4. Pokrenuti pogrešna i alternativna rešenja kroz pravi `executeTests` i uporediti sa očekivanjem.
5. Proveriti brojeve linija i sr/en podudarnost.
6. Proveriti tvrdnje iz objašnjenja u Node-u.
7. Prikazati spisak i rezultat `npm test`, pa sačekati potvrdu korisnika.
8. Na kraju grupe ili serije: `npm run build`.

---

## 5. Stanje (2026-11-07)

**Ukupno pocetnik JavaScript: 30 od 50.** Testova: 221, svi prolaze. `tsc` i lint su čisti.

### Pregledi kvaliteta koji su već urađeni

- **Pregled 1** (prvih 10 zadataka): 35 pogrešnih i alternativnih rešenja, 19 tvrdnji u Node-u. Nađeno: jedna stvarna rupa u testovima (`capitalize-words-01`), nedorečen opis u 4 zadatka, jedna netačna tvrdnja (emoji u `reverse-string-01`). Sve je ispravljeno.
- **Pregled 2** (5 zadataka): 29 rešenja, 19 tvrdnji. Nađeno: 4 rupe u testovima, jedna netačna tvrdnja. Ispravljeno. Nakon ispravki nijedno pogrešno rešenje ne prolazi.
- **Grupa 2:** 31 rešenje, 13 tvrdnji, nijedan neočekivan ishod.
- **Grupa 3:** 32 rešenja, 15 tvrdnji, nijedan neočekivan ishod.

### Zadaci po grupama

| Grupa | Tema | id | Stanje |
|---|---|---|---|
| 1 | 1 | `type-of-value-01` | napisan, testovi prolaze. **Nisu urađeni: alternativna rešenja, tvrdnje, brojevi linija** |
| 1 | 1 | `to-number-safe-01` | isto |
| 1 | 1 | `count-truthy-01` | isto |
| 1 | 1 | `parse-boolean-01` | isto |
| 1 | 2 | `letter-grade-01` | isto |
| 2 | 2 | `even-or-odd-01` | provereno (alternativna, tvrdnje, tekst) |
| 2 | 2 | `day-name-01` | provereno |
| 2 | 2 | `leap-year-01` | provereno |
| 2 | 3 | `sum-to-n-01` | provereno |
| 2 | 3 | `countdown-01` | provereno |
| 3 | 3 | `index-of-item-01` | provereno |
| 3 | 3 | `triangle-01` | provereno |
| 3 | 4 | `truncate-text-01` | provereno |
| 3 | 4 | `contains-ignore-case-01` | provereno |
| 3 | 4 | `format-time-01` | provereno |
| 4 | 4 | `split-list-01` | napisan, testovi prolaze. **Nisu urađeni: alternativna rešenja, tvrdnje, tekst, build** |
| 4 | 5 | `last-items-01` | isto |
| 4 | 5 | `has-value-01` | isto |
| 4 | 5 | `insert-at-01` | isto |
| 4 | 5 | `count-occurrences-01` | isto |

**Build** (`npm run build`) je prošao posle grupe 3, a on obuhvata sve zadatke do tada. Posle grupe 4 build još nije pokrenut.

### Pokrivenost po temama

| Tema | Gotovo | Napomena |
|---|---|---|
| 1 | 4 / 4 | provera grupe 1 nije potpuna |
| 2 | 4 / 4 | provera `letter-grade-01` nije potpuna |
| 3 | 4 / 4 | |
| 4 | 4 / 4 | `split-list-01` nije potpuno proveren |
| 5 | 4 / 4 | nije potpuno proveren |
| 6–10 | 0 / 20 | još nije početo |

Srednji (4/4) i expert (1/1) su gotovi.

---

## 6. Šta je sledeće

### A. Dovršiti grupu 4

1. **Alternativna rešenja** za svih 5 zadataka. Primeri za pokušaj:
   - `split-list-01`: bez `trim`, bez filtera praznih, `split(', ')`.
   - `last-items-01`: `slice(-count)` (pada za `0`), pogrešan indeks.
   - `has-value-01`: `indexOf(value) !== -1` (pada za `NaN`), `some(x => x == value)` (pada za `'1'`).
   - `insert-at-01`: `splice` koji menja ulaz (pada zbog neizmenjenosti), ugnježdeni niz.
   - `count-occurrences-01`: samo prvo poklapanje, brojanje od `1`, `==`.
   - **Ne pokretati** `indexOf(value, index)` bez `+ 1`. To je beskonačna petlja.
2. **Tvrdnje iz objašnjenja u Node-u**: `slice(-0)`, `indexOf` i `NaN`, `[...'a']`, `''.split(',')`.
3. **Brojevi linija i sr/en podudarnost.**
4. `npm run build`.

### B. Dovršiti grupe 1 i 2

Grupa 1 nema alternativna rešenja, proveru tvrdnji i proveru brojeva linija. Grupa 2 ih ima, ali bez builda posle nje (build je prošao posle grupe 3). Istim postupkom zatvoriti i ovu prazninu.

### C. Grupe 5–8: preostalih 20 zadataka (teme 6–10)

Predlog rasporeda:
- **Grupa 5:** tema 6 (4) + tema 7 (1)
- **Grupa 6:** tema 7 (3) + tema 8 (2)
- **Grupa 7:** tema 8 (2) + tema 9 (3)
- **Grupa 8:** tema 9 (1) + tema 10 (4)

**Predlozi ideja** (još nisu napisani):
- **Tema 6:** `mapToLengths` (`map`), `onlyLong` (`filter`), `firstOver18` (`find`), `allPositive` i `anyNegative` (`every`, `some`), `sumOfPrices` (`reduce`). Paziti na preklapanje sa `sum-evens-01`, koji već koristi `filter` i `reduce`.
- **Tema 7:** `getFullName(person)` (pristup svojstvu), `countKeys(obj)` (`Object.keys`), `mergeSettings(a, b)` (spread objekata), `pickEntries(obj)` (`Object.entries`).
- **Tema 8:** `greet(name = 'Gost')` (podrazumevana vrednost), `sumAll(...nums)` (rest), `applyTwice(fn, x)`, `makeMultiplier(k)` (arrow funkcija i closure). Paziti na `closure-counter-01`.
- **Tema 9:** `clamp(n, min, max)` (`Math.min`, `Math.max`), `pagesNeeded(total, perPage)` (`Math.ceil`), `secondsToMinutes(s)` (`Math.floor`), `isWholeNumber(n)` (`Number.isInteger`). Bez poređenja tipa `0.1 + 0.2`.
- **Tema 10:** mini zadaci koji kombinuju teme 6, 7 i 2. Primeri: zbir cena u korpi, izveštaj o ocenama, statistika reči.

Pre pisanja proveriti da se teme i id-jevi ne preklapaju sa postojećim zadacima.

### Pomoćni alati

Skripte za generisanje i provere bile su u privremenom folderu van repoa (scratchpad). Ako ih nema, dovoljna je procedura iz odeljka 4:
- helperi za `decl` (deklaracija funkcije), `close` (zatvaranje bloka), `T` (tekst objašnjenja) i `exercise` (JSON zadatka);
- harness koji pokreće pravi `executeTests` za pogrešna i alternativna rešenja.

---

## 7. Dogovori o radu

- **Model:** pisanje objašnjenja i provere preporučeno na Sonnet ili Opus. Haiku je brži, ali je propuštao greške u tekstu. Izbor modela je korisnikov.
- **Potvrda:** ne menjati zadatke bez potvrde korisnika. Svaka grupa se predaje na pregled pre sledeće.
- **Git:** sve promene su lokalne. Commit i push samo na zahtev korisnika.
