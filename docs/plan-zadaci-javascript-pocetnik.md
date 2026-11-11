# Plan: 40 novih JavaScript zadataka za nivo „početnik“

> Dopuna dokumenata [plan-js-platforma.md](plan-js-platforma.md) i [koraci-za-programiranje.md](koraci-za-programiranje.md). Ovaj dokument beleži dogovor, pravila i stanje rada, da se nastavi bez ponovnog objašnjavanja.
>
> Stanje na dan 2026-11-10.

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

## 5. Stanje (2026-11-10)

**Ukupno pocetnik JavaScript: 35 od 50.** Testovi svi prolaze (262 posle grupe 5). `tsc`, lint i `npm run build` su čisti.

### Pregledi kvaliteta

Pregled svake grupe obuhvata: pogrešna i alternativna rešenja kroz pravi `executeTests`, tvrdnje iz objašnjenja izvršene u Node-u, provera brojeva linija i sr/en podudarnosti.

- **Pregled 1** (prvih 10 zadataka): 35 rešenja, 19 tvrdnji. Ispravljeno: rupa u testovima (`capitalize-words-01`), nedorečen opis u 4 zadatka, netačna tvrdnja (emoji u `reverse-string-01`).
- **Pregled 2** (5 zadataka): 29 rešenja, 19 tvrdnji. Ispravljeno: 4 rupe u testovima, jedna netačna tvrdnja.
- **Grupa 2:** 31 rešenje, 13 tvrdnji, bez neočekivanih ishoda.
- **Grupa 3:** 32 rešenja, 15 tvrdnji, bez neočekivanih ishoda.
- **Grupa 4** (2026-11-10): 36 rešenja, 28 tvrdnji. Ispravljeno: pogrešna linija u objašnjenju (`count-occurrences-01`, rešenje sa `filter`), opis nije tražio novi niz (`last-items-01`), dodat skriveni test za falsy vrednosti (`has-value-01`).
- **Grupa 1** (2026-11-10): 63 rešenja, 49 tvrdnji, svi brojevi linija tačni. Ispravljeno: `startsWith('t')`, `includes('true')` i „samo prvo slovo“ su prolazili `parse-boolean-01`; dodat skriveni test.

### Zadaci po grupama

| Grupa | Tema | id | Stanje |
|---|---|---|---|
| 1 | 1 | `type-of-value-01`, `to-number-safe-01`, `count-truthy-01`, `parse-boolean-01` | provereno |
| 1 | 2 | `letter-grade-01` | provereno |
| 2 | 2 | `even-or-odd-01`, `day-name-01`, `leap-year-01` | provereno |
| 2 | 3 | `sum-to-n-01`, `countdown-01` | provereno |
| 3 | 3 | `index-of-item-01`, `triangle-01` | provereno |
| 3 | 4 | `truncate-text-01`, `contains-ignore-case-01`, `format-time-01` | provereno |
| 4 | 4 | `split-list-01` | provereno |
| 4 | 5 | `last-items-01`, `has-value-01`, `insert-at-01`, `count-occurrences-01` | provereno |
| 5 | 6 | `word-lengths-01`, `long-words-01`, `first-adult-01`, `all-any-01` | napisano 2026-11-11, čeka potvrdu |
| 5 | 7 | `full-name-01` | napisano 2026-11-11, čeka potvrdu |

**Build** je prošao posle grupe 4 i posle izmena na front-endu. Grupe 1–4 su zatvorene.

### Pokrivenost po temama

| Tema | Gotovo |
|---|---|
| 1–5 | 4 / 4 svaka (20 zadataka, sve provereno) |
| 6 | 4 / 4 (grupa 5, čeka potvrdu) |
| 7 | 1 / 4 (grupa 5, čeka potvrdu) |
| 8–10 | 0 / 12, još nije početo |

Srednji (4/4) i expert (1/1) su gotovi.

### Front-end izmene (2026-11-10)

- **Dugme „Sledeći zadatak“** u gornjoj traci radnog ekrana: vodi na sledeći zadatak istog nivoa i oblasti, redom kao u listi. Zeleno je kad je zadatak rešen. Na poslednjem zadatku u nivou ga nema. Radni ekran se pravi iznova za svaki zadatak (`key`), pa tajmer i kod ne prelaze na sledeći.
- **„Nazad“ vraća odakle je korisnik došao:** linkovi ka zadatku nose `?from=<putanja>` (stranica oblasti sa nivoom, ili Pregled); „Sledeći zadatak“ prenosi isti `from`. Bez `from` vraća na listu oblasti i nivoa tog zadatka. Dozvoljene su samo putanje na sajtu na istom jeziku. Kod: `lib/back-link.ts` (+ test).
- **Izabrani nivo na stranici oblasti je u adresi** (`?level=`), pa se lista otvara na istom nivou. Filteri po tipu i temi se još ne pamte.
- Ništa od ovoga nije isprobano klikom u browseru (provereni su HTML odgovori produkcionog servera).

---

## 6. Šta je sledeće

### A. Grupe 5–8: preostalih 20 zadataka (teme 6–10)

Konačan spisak (zamenjuje ranije predloge ideja). Svaka stavka: **id**, potpis, šta radi, **Pojam** koji opis uvodi (pravilo 3.1 iz [pravila-za-opis-zadataka.md](pravila-za-opis-zadataka.md)), pa **Zamke**: granični slučajevi koje skriveni testovi pokrivaju i koje opis mora da pomene, svaki sa primerom.

Tekst koji funkcije vraćaju je na engleskom (`'Hello, Guest!'`), isti u oba jezika, kao u postojećim zadacima.

**Grupa 5: metode nizova i prvi zadatak sa objektima** (napisana 2026-11-11, čeka potvrdu)
- **word-lengths-01** (tema 6) — `wordLengths(words)`: niz dužina reči. Pojam: `map` pravi nov niz iste dužine; funkcija kao argument (callback) i arrow funkcija. Zamke: prazan niz; prazan tekst ima dužinu 0; ulaz se ne menja.
- **long-words-01** (tema 6) — `longWords(words, min)`: reči sa bar `min` slova. Pojam: `filter` zadržava elemente za koje callback vrati `true`. Zamke: dužina tačno `min` ulazi; nijedna ne prolazi daje `[]`; redosled ostaje; ulaz se ne menja.
- **first-adult-01** (tema 6) — `firstAdult(people)`: prvi objekat sa `age` 18 ili više. Pojam: `find` vraća prvi element ili `undefined`. Zamke: tačno 18 se računa; nema nikog daje `undefined`; vraća se prvi po redu, ne najstariji; vraća se isti objekat, ne kopija.
- **all-any-01** (tema 6) — `allPositive(nums)` i `anyNegative(nums)`. Pojam: `every` i `some`. Zamke: prazan niz daje `true` za `allPositive` i `false` za `anyNegative` (objasniti zašto); `0` nije ni pozitivan ni negativan.
- **full-name-01** (tema 7) — `getFullName(person)`: `'Ana Maria Petrovic'` iz `firstName`, `middleName` (može da nedostaje), `lastName`. Pojam: čitanje svojstva objekta; svojstvo koje ne postoji je `undefined`. Zamke: bez srednjeg imena nema duplog razmaka; srednje ime `''` se tretira kao da ga nema.

**Grupa 6: objekti i funkcije**
- **safe-city-01** (tema 7) — `getCity(user)`: `user.address.city`, ili `'Unknown'` ako `address` ili `city` ne postoji. Pojam: čitanje svojstva od `undefined` baca grešku; `?.` i `??`. Zamke: `address` je `undefined`; `address` je `null`; `city` je `''` (vraća se `''`, ne `'Unknown'`, jer `??` reaguje samo na `null` i `undefined`).
- **merge-settings-01** (tema 7) — `mergeSettings(defaults, user)`: nov objekat u kome vrednosti iz `user` prepisuju `defaults`. Pojam: spread objekta, redosled odlučuje ko pobeđuje. Zamke: nijedan ulaz se ne menja; prazan `user`; ključ koji postoji samo u `user`; vrednost `false` i `0` iz `user` prepisuju.
- **format-entries-01** (tema 7) — `formatEntries(obj)`: niz tekstova `'key: value'`. Pojam: `Object.entries` (uz pomen `Object.keys` i `Object.values`). Zamke: prazan objekat daje `[]`; redosled kao u objektu; vrednost broj i `true` postaju tekst.
- **greet-default-01** (tema 8) — `greet(name = 'Guest')` → `'Hello, Ana!'`. Pojam: podrazumevana vrednost parametra. Zamke: poziv bez argumenta i sa `undefined` koristi podrazumevanu; `''` i `null` je ne koriste (opis kaže šta se tada vraća: `'Hello, !'` i `'Hello, null!'`).
- **sum-all-01** (tema 8) — `sumAll(...nums)`: zbir svih argumenata. Pojam: rest parametar skuplja argumente u niz. Zamke: bez argumenata daje `0`; jedan argument; negativni brojevi.

**Grupa 7: funkcije i Math**
- **apply-twice-01** (tema 8) — `applyTwice(fn, x)`: `fn(fn(x))`. Pojam: funkcija je vrednost i može se proslediti. Zamke: `fn` se poziva tačno dvaput; radi i sa tekstom (`(s) => s + '!'`).
- **make-multiplier-01** (tema 8) — `makeMultiplier(k)`: vraća funkciju koja množi sa `k`. Pojam: podsetnik na closure (uveden u `closure-counter-01`), arrow funkcija koja vraća vrednost bez `return`. Zamke: dva množioca su nezavisna; `k` je `0`; negativan `k`. Razlika od `closure-counter-01`: ovde se zapamćena vrednost ne menja.
- **clamp-01** (tema 9) — `clamp(n, min, max)`: `n` ograničen na opseg. Pojam: `Math.min` i `Math.max`. Zamke: `n` tačno na granici; `n` ispod i iznad; `min` jednak `max`; negativan opseg. Opis kaže da je uvek `min <= max`.
- **pages-needed-01** (tema 9) — `pagesNeeded(total, perPage)`: broj stranica. Pojam: `Math.ceil`, uz kratko poređenje sa `Math.floor`. Zamke: `total` 0 daje 0; deljivo bez ostatka; jedan element viška otvara novu stranicu. Opis kaže da je `perPage` ceo broj, 1 ili veći.
- **average-rounded-01** (tema 9) — `averageRounded(nums)`: prosek zaokružen na ceo broj. Pojam: `Math.round`. Zamke: prazan niz daje `0` (ne `NaN`); polovina se zaokružuje nagore, i kod negativnih (`-2.5` daje `-2`, objasniti); jedan element.

**Grupa 8: brojevi i mini zadaci**
- **is-whole-number-01** (tema 9) — `isWholeNumber(value)`. Pojam: `Number.isInteger`. Zamke: `5.0` je ceo; `'5'` nije, jer je tekst; `NaN` i `Infinity` nisu; negativni celi jesu.
- **cart-total-01** (tema 10) — `cartTotal(items)`: zbir `price * quantity`. Kombinuje objekte i `reduce`. Zamke: prazna korpa daje `0`; `quantity` 0; ulaz se ne menja. Cene su celi brojevi. Razlika od `sum-evens-01`: sabiraju se svojstva objekata.
- **passed-names-01** (tema 10) — `passedNames(students, minScore)`: imena učenika sa `score` bar `minScore`. Kombinuje `filter` i `map`. Zamke: tačno `minScore` prolazi; niko ne prolazi daje `[]`; redosled ostaje.
- **word-frequency-01** (tema 10) — `wordFrequency(text)`: objekat reč → broj pojavljivanja. Kombinuje tekst, petlju i objekat kao brojač. Zamke: velika i mala slova su ista reč; više razmaka zaredom; prazan tekst daje `{}`. Razlika od `count-occurrences-01` (jedna vrednost u nizu) i `count-words-01` (samo ukupan broj).
- **sort-numbers-01** (tema 10) — `sortNumbers(nums)`: nov niz, rastuće. Pojam: `sort` bez argumenta poredi kao tekst (`[10, 9, 1]` daje `[1, 10, 9]`) i menja niz nad kojim se poziva. Zamke: dvocifreni i jednocifreni zajedno; negativni; ulaz se ne menja; duplikati ostaju.

**Odstupanja od ranijeg rasporeda tema (namerna):**
- `count-keys` je zamenjen sa `safe-city-01`, jer srednji nivo koristi `?.` i `??` bez objašnjenja.
- `seconds-to-minutes` je izbačen zbog preklapanja sa `format-time-01`; umesto njega `average-rounded-01`.
- `reduce` nije u temi 6 (pokriva ga `sum-evens-01`), nego u `cart-total-01`.
- Tema 10 je dobila `sort-numbers-01`, jer je podrazumevano sortiranje česta zamka.

Pre pisanja svake grupe proveriti da se id-jevi ne preklapaju sa postojećim zadacima.

**Redosled prikaza** svih 50 zadataka je u [plan-redosled-javascript.md](plan-redosled-javascript.md), odeljak 3. On određuje i koji zadatak uvodi pojam: „Pojam“ iz spiska gore se objašnjava u celosti samo u zadatku koji je prvi po tom redosledu, a u ostalima ide jedna rečenica podsetnika (na primer, `apply-twice-01` dolazi pre `word-lengths-01`).

### Pomoćni alati

Skripte za generisanje i provere bile su u privremenom folderu van repoa (scratchpad). Ako ih nema, dovoljna je procedura iz odeljka 4:
- helperi za `decl` (deklaracija funkcije), `close` (zatvaranje bloka), `T` (tekst objašnjenja) i `exercise` (JSON zadatka);
- harness koji pokreće pravi `executeTests` za pogrešna i alternativna rešenja.

---

## 7. Dogovori o radu

- **Model:** pisanje objašnjenja i provere preporučeno na Sonnet ili Opus. Haiku je brži, ali je propuštao greške u tekstu. Izbor modela je korisnikov.
- **Potvrda:** ne menjati zadatke bez potvrde korisnika. Svaka grupa se predaje na pregled pre sledeće.
- **Git:** sve promene su lokalne. Commit i push samo na zahtev korisnika.
