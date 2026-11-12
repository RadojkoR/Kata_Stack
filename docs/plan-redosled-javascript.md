# Plan: redosled JavaScript zadataka (početnik, srednji, expert)

> Dopuna dokumenata [plan-zadaci-javascript-pocetnik.md](plan-zadaci-javascript-pocetnik.md), [plan-zadaci-ostale-oblasti.md](plan-zadaci-ostale-oblasti.md) i [plan-zadaci-javascript-dodatni.md](plan-zadaci-javascript-dodatni.md).
> Namenjeno modelu koji radi izmene (Sonnet) i meni za praćenje stanja.
>
> Stanje na dan 2026-11-11: mehanizam redosleda (odeljak 2) je urađen i radi za JavaScript; fajl `content/order/javascript.json` sadrži sve zadatke koji danas postoje. Odeljci 3–5 su ciljni redosled; nove zadatke upisivati u fajl na mesto iz tih odeljaka.

---

## 1. Problem i cilj

Zadaci se danas prikazuju po abecedi imena fajla (`lib/content.ts`, funkcija `listJson` sortira putanje). Zato početnik može da dobije `closure-counter-01` pre nego što vidi petlju, a dugme „Sledeći zadatak" vodi abecedno.

**Cilj:** unutar svakog nivoa zadaci idu redom kojim se JavaScript uči u praksi. Zadatak koji uvodi pojam dolazi pre zadataka koji taj pojam koriste. Isti redosled važi svuda: lista na stranici oblasti, Pregled i dugme „Sledeći zadatak".

Ovaj dokument ima dva dela: izmenu u kodu (odeljak 2) i same redoslede (odeljci 3–5).

---

## 2. Izmena u kodu

### 2.1 Fajl redosleda

Redosled se čuva u jednom fajlu po oblasti, ne u svakom zadatku. Tako promena redosleda menja jedan fajl.

`content/order/javascript.json`:

```json
{
  "pocetnik": ["type-of-value-01", "to-number-safe-01"],
  "srednji": ["debounce-01"],
  "expert": ["curry-01"]
}
```

Kasnije se isto pravi za `typescript.json` i `node.json`. Dok oblast nema fajl redosleda, njeni zadaci ostaju po abecedi, kao danas.

### 2.2 Ponašanje

- `getExercises()` vraća zadatke ovim redom: oblast (redom iz `AREAS`), nivo (redom iz `LEVELS`), pa mesto u fajlu redosleda.
- Zadatak koji postoji, a nije u fajlu redosleda, ide na kraj svog nivoa, po abecedi. Ovo važi samo dok oblast nema fajl; čim ga ima, test iz 2.3 traži da svi budu upisani.
- Fajl redosleda sadrži **samo zadatke koji postoje**. Planirani zadaci se upisuju kad se napišu, na mesto iz odeljaka 3–5.

### 2.3 Provere (padaju u `npm test` i u `npm run build`)

- id u fajlu redosleda koji ne postoji kao zadatak te oblasti i tog nivoa;
- isti id naveden dvaput;
- zadatak oblasti koja ima fajl redosleda, a nije upisan u njega.

Poruke grešaka u istom stilu kao postojeće u `lib/catalog.ts` (`ContentError`).

### 2.4 Gde se menja

- `types/exercise.ts`: shema fajla redosleda (zod, `strictObject`, ključevi su nivoi).
- `lib/catalog.ts`: provere iz 2.3 u `buildCatalog`, i sortiranje.
- `lib/content.ts`: čitanje `content/order/*.json`.
- Testovi: `lib/catalog.test.ts` za provere i sortiranje.
- Mesta koja koriste redosled ne bi trebalo menjati, ali ih treba proveriti: `app/[lang]/(dashboard)/area/[area]/page.tsx`, `app/[lang]/(dashboard)/page.tsx`, `app/[lang]/exercise/[id]/page.tsx` (odatle dugme „Sledeći zadatak" uzima susede) i `lib/browse.ts` (da neko sortiranje tamo ne pokvari redosled).

Pre izmene koda u `app/` važi uputstvo iz `AGENTS.md` (pročitati odgovarajući vodič u `node_modules/next/dist/docs/`).

### 2.5 Postupak

1. Uvesti mehanizam i fajl `content/order/javascript.json` sa svim zadacima koji danas postoje, redom iz odeljaka 3–5.
2. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
3. Proveriti u browseru: lista početnika kreće od `type-of-value-01`, a „Sledeći zadatak" vodi istim redom.
4. Od tada, svaka nova grupa zadataka upisuje svoje id-jeve u fajl redosleda u istoj izmeni.

### 2.6 Pregled opisa posle uvođenja redosleda

Opisi su pisani dok je redosled bio drugačiji, pa pravilo 3.1 iz [pravila-za-opis-zadataka.md](pravila-za-opis-zadataka.md) (nov pojam se objašnjava tamo gde se prvi put pojavi) možda više ne važi svuda.

- Proći kroz početnike redom iz odeljka 3 i zapisati: gde se pojam koristi pre nego što je objašnjen, i gde se objašnjava drugi put.
- **Ne menjati opise odmah.** Napraviti spisak nalaza i predati ga korisniku na potvrdu (dogovor iz plana za početnike, odeljak 7).
- Za zadatke koji tek treba da se napišu: „Pojam" naveden u planu se objašnjava u celosti samo ako je taj zadatak prvi po redosledu koji ga koristi. Inače ide jedna rečenica podsetnika.

---

## 3. Početnik (50)

Postojeći zadaci su provereni čitanjem rešenja (2026-11-11) i pomereni gde su koristili pojmove koji po redu dolaze kasnije; pomeranja su u odeljku 7. Za nove zadatke važi isto: pre upisa pogledati šta rešenje koristi.

Zadaci označeni sa (novo) su iz grupa 5–8 plana za početnike i još nisu napisani.

**1. Tipovi i konverzije**
1. `type-of-value-01`
2. `to-number-safe-01`
3. `parse-boolean-01`

**2. Uslovi**
4. `even-or-odd-01`
5. `letter-grade-01`
6. `day-name-01`
7. `leap-year-01`

**3. Brojevi i Math**
8. `clamp-01` (novo)
9. `pages-needed-01` (novo)
10. `is-whole-number-01` (novo)

**4. Petlje**
11. `sum-to-n-01`

**5. Tekst**
12. `truncate-text-01`
13. `contains-ignore-case-01`
14. `format-time-01`
15. `count-vowels-01`

**6. Nizovi, osnovno (uključujući petlje nad nizovima)**
16. `index-of-item-01`
17. `has-value-01`
18. `last-items-01`
19. `insert-at-01`
20. `countdown-01`
21. `triangle-01`
22. `count-occurrences-01`
23. `max-in-array-01`
24. `count-truthy-01`
25. `unique-values-01`
26. `average-rounded-01` (novo)

**7. Tekst i nizovi zajedno**
27. `reverse-string-01`
28. `is-palindrome-01`
29. `split-list-01`

**8. Funkcije**
30. `greet-default-01` (novo)
31. `sum-all-01` (novo)
32. `apply-twice-01` (novo)
33. `fizzbuzz-01`
34. `make-multiplier-01` (novo)
35. `closure-counter-01`

**9. Objekti**
36. `full-name-01` (novo)
37. `safe-city-01` (novo)
38. `merge-settings-01` (novo)
39. `format-entries-01` (novo)
40. `count-words-01`

**10. Metode nizova**
41. `word-lengths-01` (novo)
42. `capitalize-words-01`
43. `long-words-01` (novo)
44. `first-adult-01` (novo)
45. `all-any-01` (novo)
46. `sum-evens-01`
47. `sort-numbers-01` (novo)

**11. Mini zadaci**
48. `passed-names-01` (novo)
49. `cart-total-01` (novo)
50. `word-frequency-01` (novo, vidi napomenu u odeljku 7)

Posledice za pisanje novih zadataka:
- `apply-twice-01` dolazi pre `word-lengths-01`, pa on uvodi „funkcija kao argument" i arrow funkciju; `word-lengths-01` ih samo pominje.
- `make-multiplier-01` dolazi pre `closure-counter-01`, pa on uvodi closure. Opis `closure-counter-01` ide na spisak iz 2.6.

---

## 4. Srednji (39)

Oznake: (novo) još nije napisan; izvor je osnovni plan ili dodatni plan.

**1. Uvod: greške, tajmeri, prvi `await`**
1. `safe-json-01` (novo)
2. `custom-errors-01` (novo)
3. `run-later-01` (novo)
4. `first-await-01` (novo)
5. `load-or-default-01` (novo)
6. `sleep-timeout-01` (novo)

**2. Closure i funkcije višeg reda**
7. `once-01`
8. `partial-01`
9. `compose-pipe-01`
10. `memoize-01`
11. `debounce-01`
12. `throttle-01`

**3. Nizovi i `Map`**
13. `chunk-01` (novo)
14. `zip-01` (novo)
15. `flatten-01`
16. `sort-by-01` (novo)
17. `unique-by-01` (novo)
18. `group-by-js-01`
19. `anagram-groups-01` (novo)

**4. Objekti i nepromenljivost**
20. `pick-omit-01` (novo)
21. `get-path-01` (novo)
22. `set-path-01` (novo)
23. `immutable-update-01` (novo)
24. `deep-clone-01` (novo)
25. `deep-equal-01` (novo)

**5. Tekst, regex, datumi, algoritmi**
26. `template-01` (novo)
27. `extract-hashtags-01` (novo)
28. `valid-brackets-01` (novo)
29. `days-between-01` (novo)
30. `binary-search-01` (novo)

**6. Klase i stanje**
31. `queue-01` (novo)
32. `bank-account-01` (novo)
33. `create-store-01` (novo)

**7. Asinhrono**
34. `sequence-01` (novo)
35. `promisify-01` (novo)
36. `promise-all-01`
37. `promise-race-01` (novo)
38. `promise-all-settled-01` (novo)
39. `promise-any-01` (novo)

---

## 5. Expert (17)

**1. Funkcije i `this`**
1. `curry-01`
2. `my-bind-01` (novo)
3. `debounce-advanced-01` (novo)

**2. Strukture podataka i algoritmi**
4. `lru-cache-01` (novo)
5. `event-emitter-01` (novo)
6. `topological-sort-01` (novo)
7. `range-iterator-01` (novo)

**3. Duboke strukture i parsiranje**
8. `deep-equal-cycles-01` (novo)
9. `json-stringify-01` (novo)
10. `json-parse-01` (novo)
11. `parse-query-nested-01` (novo)

**4. Asinhrono**
12. `async-pipe-01` (novo)
13. `retry-backoff-01` (novo)
14. `promise-pool-01` (novo)
15. `dedupe-requests-01` (novo)
16. `my-promise-01` (novo)

**5. Završni**
17. `reactive-01` (novo)

---

## 5a. TypeScript i Node.js

Isti mehanizam: `content/order/typescript.json` i `content/order/node.json` postoje i sadrže zadatke koji danas postoje. `react-next` nema zadataka, pa nema ni fajla (provere važe samo za oblasti koje fajl imaju); dobiće ga sa prvim zadatkom.

Postojeći zadaci su provereni čitanjem rešenja: `my-pick-01` (mapped tip) ide pre `my-exclude-01` (uslovni tip), a `group-by-01` (generička funkcija) pre `deep-readonly-01` (rekurzivni tip).

Ciljni redosled kad se napišu svi zadaci iz [plan-zadaci-ostale-oblasti.md](plan-zadaci-ostale-oblasti.md). Upisuje se u fajl kako se zadaci pišu, ne unapred. Kod tipskih zadataka (`types`) pojam „mapped tip“ uvodi `my-partial-01`, a „uslovni tip“ prvi zadatak koji ga koristi; kasniji samo podsećaju.

**TypeScript, početnik (12)**
1. `typed-user-01`
2. `status-union-01`
3. `type-guards-01`
4. `as-const-01`
5. `generic-first-01`
6. `generic-last-01`
7. `key-of-01`
8. `my-partial-01`
9. `my-readonly-01`
10. `my-record-01`
11. `my-pick-01`
12. `my-exclude-01`

**TypeScript, srednji (12)**
1. `overloads-01`
2. `group-by-01`
3. `typed-fetch-01`
4. `api-state-01`
5. `typed-emitter-01`
6. `my-omit-01`
7. `mutable-01`
8. `my-return-type-01`
9. `my-awaited-01`
10. `tuple-first-last-01`
11. `tuple-to-union-01`
12. `deep-readonly-01`

**TypeScript, expert (8)**
1. `branded-ids-01`
2. `deep-partial-01`
3. `camel-case-keys-01`
4. `route-params-01`
5. `tuple-reverse-01`
6. `union-to-intersection-01`
7. `typed-builder-01`
8. `mini-schema-01`

**Node.js, početnik (8)**
1. `parse-query-01`
2. `parse-cookies-01`
3. `build-url-01`
4. `match-route-01`
5. `parse-csv-01`
6. `env-config-01`
7. `validate-signup-01`
8. `json-response-01`

**Node.js, srednji (10)**
1. `retry-01`
2. `paginate-01`
3. `http-errors-01`
4. `middleware-chain-01`
5. `mini-router-01`
6. `crud-memory-01`
7. `ttl-cache-01`
8. `rate-limiter-01`
9. `sign-token-01`
10. `hash-password-01`

**Node.js, expert (6)**
1. `token-bucket-01`
2. `sliding-window-limiter-01`
3. `cache-stampede-01`
4. `job-queue-01`
5. `idempotency-01`
6. `graceful-shutdown-01`

---

## 6. Šta ide posle (nije deo ovog plana)

- **Zadaci tipa `bug-hunt`.** Shema ih već podržava (`BugHuntExerciseSchema`), čeka se radni ekran. Dogovor: taj ekran ima prednost nad poslednjom trećinom klasičnih zadataka, jer je nalaženje greške u tuđem kodu bliže stvarnom poslu. Kad dođe na red, dobija svoj plan.

---

## 7. Stanje i izmene redosleda

| Datum | Šta je urađeno | Napomena |
|---|---|---|
| 2026-11-11 | Uveden mehanizam: shema `OrderSchema`, `parseOrderFile` i provere u `lib/catalog.ts`, čitanje u `lib/content.ts`, 8 novih testova u `lib/catalog.test.ts`, fajl `content/order/javascript.json` (30 + 9 + 1 zadatak). `npm test` (247), `tsc`, lint i `npm run build` prolaze. Proveren HTML produkcionog servera: lista početnika kreće od `type-of-value-01`, a „Sledeći zadatak“ prati fajl redosleda (nije isprobano klikom u browseru). | Stranice u `app/` i `lib/browse.ts` nisu menjane: svi koriste redosled iz `getExercises()`, a nigde se ne sortira ponovo. |
| 2026-11-11 | Dodati `content/order/typescript.json` (3 + 2 zadatka) i `content/order/node.json` (1 + 1). Ciljni redosled za TypeScript i Node.js je u odeljku 5a. | `react-next` nema zadataka, pa nema ni fajla. |
| 2026-11-11 | Upisani zadaci grupe 5 za početnike: `full-name-01`, `word-lengths-01`, `long-words-01`, `first-adult-01`, `all-any-01` (mesta po odeljku 3). | Pojam „callback i strelica“ je u `word-lengths-01` samo kratko pomenut, jer ga po redosledu uvodi `apply-twice-01` (grupa 7, još nije napisan); do tada je redosled na stranici nepotpun. |
| 2026-11-11 | Upisani zadaci grupe 6 za početnike: `greet-default-01`, `sum-all-01`, `safe-city-01`, `merge-settings-01`, `format-entries-01`. | Redosled na stranici još preskače `apply-twice-01` i `make-multiplier-01` (grupa 7). `format-entries-01` rešenja ne koriste `map`, jer `map` po redosledu dolazi tek u bloku 10. |

Pomeranja zadataka u odnosu na prvobitni raspored (2026-11-11), posle čitanja rešenja:

| Zadatak | Zašto je pomeren |
|---|---|
| `countdown-01`, `triangle-01` | rešenja koriste niz i `push`, a nizovi su u bloku 6; prešli iz bloka 4 u blok 6 |
| `reverse-string-01`, `is-palindrome-01` | koriste spread niza, `reverse`, `join` i regex; prešli iz bloka 5 u blok 7 |
| `split-list-01` | koristi `push` i niz; ostaje u bloku 7 |
| `fizzbuzz-01` | jedino rešenje je `Array.from` sa callback-om; prešao u blok 8, iza `apply-twice-01`. Predlog: dodati rešenje sa običnom petljom, pa ga vratiti u blok 4 |
| `count-words-01` | koristi objekat kao brojač i `??`; prešao u blok 9 |
| `capitalize-words-01` | koristi `map`; prešao u blok 10 |

Otvorena pitanja za korisnika:

- **`count-words-01` i `word-frequency-01` su isti zadatak.** `count-words-01` već vraća objekat reč → broj (velika i mala slova ista, prazni tokeni se preskaču). Plan za početnike ga pogrešno opisuje kao „samo ukupan broj“. `word-frequency-01` treba zameniti drugim mini zadatkom (na primer najčešća reč ili reči koje se ponavljaju); izbor je korisnikov.
- **Blok 4 (petlje) ima samo `sum-to-n-01`.** Ostale petlje su u bloku 6, jer rade nad nizovima. Ako se želi više čistih petlji, dodati zadatak sa `while` ili ugnježdenim petljama koji ne gradi niz.
- `day-name-01` ima drugo rešenje sa `??`, koji se prvi put uvodi tek u `safe-city-01`; objašnjenje tog rešenja već pokriva `??`, pa je ostavljeno.

Dalja pomeranja upisivati ovde, sa razlogom.
