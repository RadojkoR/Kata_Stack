# Plan dodatnih JavaScript zadataka: 19 srednji i 5 expert

> Dopuna dokumenta [plan-zadaci-ostale-oblasti.md](plan-zadaci-ostale-oblasti.md). Ovo su zadaci **preko** onih iz tog plana, ne zamena za njih.
> Redosled prikaza svih JavaScript zadataka je u [plan-redosled-javascript.md](plan-redosled-javascript.md).
> Namenjeno modelu koji piše zadatke (Sonnet) i meni za praćenje stanja.
>
> Stanje na dan 2026-11-11: spisak je dogovoren, nijedan zadatak odavde još nije napisan.

---

## 1. Obim

| Nivo | Postoji | Osnovni plan (odeljak 4) | Ovaj dokument | Ukupno |
|---|---|---|---|---|
| srednji | 9 | još 11 | 19 (4 uvodna + 15) | 39 |
| expert | 1 | još 11 | 5 | 17 |

„Postoji" za srednji: 4 stara zadatka i 5 iz grupe 1 osnovnog plana (`throttle-01`, `once-01`, `compose-pipe-01`, `partial-01`, `group-by-js-01`).

Svi zadaci su `runtime: "worker"`, `type: "classic"`, u `content/exercises/javascript/<nivo>/`.

**Expert se ne povećava preko 17.** Svaki expert zadatak traži pregled jačim modelom; bolje manje dobro proverenih nego više.

### Izmene u odnosu na prvu verziju ovog dokumenta (dogovoreno 2026-11-11)

- **Dodata 4 uvodna zadatka** (odeljak 3.1). Razlog: početnik nema nijedan zadatak sa tajmerom, `try/catch` ili `await`, a srednji je odmah kretao sa `debounce` i promise-ima.
- **Pet zadataka je zamenjeno**, jer je srednji nivo bio previše nalik biblioteci pomoćnih funkcija, a nije imao greške, `Map`, regex, datume ni klase:

| Izbačen | Umesto njega | Tema koju dobijamo |
|---|---|---|
| `partition-01` | `custom-errors-01` | sopstvene klase grešaka |
| `intersection-difference-01` | `anagram-groups-01` | `Map` |
| `case-convert-01` | `extract-hashtags-01` | regex |
| `flatten-object-01` | `days-between-01` | datumi |
| `deep-merge-01` | `bank-account-01` | klase i privatna polja |

---

## 2. Pravila

Važi sve iz [plan-zadaci-ostale-oblasti.md](plan-zadaci-ostale-oblasti.md), odeljak 2 (uključujući pravila o vremenu, objašnjenjima, rešenjima i tagovima), i sve na šta se taj odeljak poziva. Stavke se čitaju kao u odeljku 3 tog plana: **id**, potpis, šta radi, pa **Zamke**.

Dodatno za ovaj dokument:

- **Bez preklapanja.** Pre pisanja proveriti da zadatak ne ponavlja postojeći ili planirani. Parovi na koje treba paziti su navedeni uz zadatak („Razlika od ...").
- **Novi tagovi** koje ovaj dokument uvodi: `algorithms`, `state`, `this`, `dates`. Tagovi `data-structures`, `classes`, `immutability` i `iterators` su već najavljeni u osnovnom planu, a `regex` i `errors` već postoje. Svaki nov tag se dodaje u `sr.json` i `en.json` kad se prvi put upotrebi.
- **Redosled.** Kad se zadatak napiše, njegov id se upisuje u fajl redosleda na mesto određeno u [plan-redosled-javascript.md](plan-redosled-javascript.md) (ako je mehanizam redosleda već uveden).
- **Uvodni zadaci (3.1) se pišu kao prelaz sa početnika**: opis objašnjava nov pojam po pravilu 3.1 iz [pravila-za-opis-zadataka.md](pravila-za-opis-zadataka.md), iako je nivo srednji, a objašnjenje rešenja ide skoro liniju po liniju.
- **Spisak je dogovoren, ali nije ugovor.** Zamene se upisuju u odeljak 6.

---

## 3. Srednji (19 novih)

### 3.1 Uvodni zadaci (4)

U prikazu idu na sam početak srednjeg nivoa. Svaki uvodi tačno jedan nov pojam.

- **safe-json-01** — `safeJsonParse(text, fallback)`: vraća parsiranu vrednost, ili `fallback` ako tekst nije ispravan JSON. Pojam: `try/catch`. Zamke: tekst `'null'` vraća `null`, ne `fallback`; `'0'` i `'false'` vraćaju `0` i `false`; prazan tekst vraća `fallback`; funkcija nikad ne baca grešku.
- **run-later-01** — `runLater(fn, ms, ...args)`: poziva `fn(...args)` posle `ms` milisekundi i vraća funkciju za otkazivanje. Pojam: `setTimeout` i `clearTimeout`. Zamke: `fn` se ne poziva pre isteka; argumenti se prosleđuju; otkazivanje pre isteka sprečava poziv; otkazivanje posle izvršenja ne baca grešku. Pisati pre svega što koristi tajmere u opisu; `debounce-01` u prikazu dolazi posle njega.
- **first-await-01** — `async function getUserName(fetchUser, id)`: čeka `fetchUser(id)` i vraća `user.name`. Pojam: promise, `async` i `await`. Zamke: funkcija vraća promise (test koristi `await` i `.resolves`); `fetchUser` se poziva tačno jednom, sa prosleđenim `id`; ako `fetchUser` odbije, greška se prosleđuje dalje nepromenjena.
- **load-or-default-01** — `async function loadOrDefault(load, fallback)`: vraća rezultat `load()`, ili `fallback` ako `load` odbije. Pojam: `try/catch` oko `await`. Zamke: uspešan rezultat `0`, `''` i `null` se vraća kakav jeste, ne `fallback`; `load` koja baci grešku sinhrono takođe daje `fallback`; funkcija nikad ne odbija. Pisati posle `first-await-01` i `safe-json-01`.

### 3.2 Glavni spisak (15)

**Greške i klase**
- **custom-errors-01** — `class ValidationError extends Error` sa poljem `field`, i `parseAge(input)` koja vraća ceo broj ili baca `ValidationError`. Zamke: `error instanceof ValidationError` i `instanceof Error` su oba tačna; `error.name` je `'ValidationError'`; `field` je `'age'`; tekst koji nije broj, negativan broj i decimalan broj bacaju grešku; `'42'` daje `42`.
- **bank-account-01** — `class BankAccount` sa `deposit(amount)`, `withdraw(amount)` i svojstvom `balance` samo za čitanje. Pojam: privatno polje (`#balance`) i getter. Zamke: `withdraw` preko stanja baca grešku i ne menja stanje; iznos `0` ili negativan baca grešku; dodela `account.balance = 100` ne menja stanje; dva računa su nezavisna.
- **queue-01** — `class Queue` sa `enqueue`, `dequeue`, `peek`, `size`, `isEmpty`. Zamke: `dequeue` i `peek` na praznom redu vraćaju `undefined`; redosled FIFO posle mešanih operacija; dva reda su nezavisna; `size` je svojstvo za čitanje (getter). Drugo rešenje: indeks glave ili dva steka umesto `shift`.

**Nizovi, `Map` i objekti**
- **unique-by-01** — `uniqueBy(items, keyFn)`: zadržava prvi element za svaki ključ. Zamke: redosled prvog pojavljivanja; ključevi `1` i `'1'` su različiti (za razliku od `group-by-js-01`, ovde se ključ ne pretvara u tekst); prazan niz; ulaz se ne menja. Razlika od `unique-values-01` (početnik): poređenje ide preko ključa, ne preko same vrednosti.
- **anagram-groups-01** — `groupAnagrams(words)`: niz grupa reči sastavljenih od istih slova. Tema: `Map` kao rečnik sa redosledom unosa. Zamke: grupe idu po prvom pojavljivanju, reči u grupi po redosledu ulaza; velika i mala slova se ne razlikuju, ali reč ostaje kako je napisana; reč bez para je grupa od jednog člana; prazan niz.
- **set-path-01** — `setPath(obj, path, value)`: vraća nov objekat sa postavljenom vrednošću na putanji `'a.b.c'`. Zamke: original se ne menja ni na jednom nivou; delovi koji nisu na putanji ostaju iste reference (test sa `toBe`); nedostajući međukoraci se prave kao objekti. Par za `get-path-01` iz osnovnog plana; pisati posle njega.
- **immutable-update-01** — `toggleTodo(todos, id)` i `removeTodo(todos, id)`: nov niz, bez menjanja ulaza. Zamke: izmenjeni element je nov objekat, a neizmenjeni ostaju iste reference (`toBe`); nepostojeći `id` vraća niz sa istim sadržajem; original posle poziva ostaje isti.

**Tekst, regex, datumi i algoritmi**
- **template-01** — `render('Hello {{name}}', data)`. Zamke: razmaci unutar zagrada (`{{ name }}`); ključ koji ne postoji daje prazan tekst; isti ključ više puta; putanja `{{user.name}}`; vrednost `0` se ispisuje kao `'0'`.
- **extract-hashtags-01** — `extractHashtags(text)`: niz oznaka bez znaka `#`, redom pojavljivanja. Tema: regex sa zastavicom `g`. Zamke: tekst bez oznaka daje `[]`; sam znak `#` nije oznaka; oznaka se završava na interpunkciji i razmaku; cifre i donja crta su dozvoljene; ista oznaka dvaput ostaje dvaput.
- **valid-brackets-01** — `isBalanced(text)`: da li su `()`, `[]` i `{}` pravilno upareni. Zamke: `'(]'`; `'(()'` i `'())'`; ostali znakovi se ignorišu; prazan tekst je ispravan; `')('` nije.
- **days-between-01** — `daysBetween(a, b)`: broj dana između dva datuma zadata kao `'YYYY-MM-DD'`. Zamke: redosled argumenata nije bitan; isti dan daje `0`; prelaz preko meseca i godine; 29. februar prestupne godine; račun u UTC, da promena letnjeg vremena ne pomeri rezultat (objasniti u opisu). Bez trenutnog vremena u rešenju.
- **binary-search-01** — `binarySearch(sorted, target)` → indeks ili `-1`. Zamke: prazan niz; prvi i poslednji element; vrednost koje nema; broj pristupa nizu je logaritamski (test sa nizom od 1 000 000 elemenata i brojačem pristupa, sa velikom rezervom). Razlika od `index-of-item-01` (početnik): tamo je linearno traženje.

**Stanje i asinhrono**
- **create-store-01** — `createStore(reducer, initialState)` sa `getState`, `dispatch`, `subscribe` (mali Redux). Zamke: `subscribe` vraća funkciju za odjavu; slušaoci se pozivaju posle promene stanja, redom prijave; odjava tokom obaveštavanja ne preskače ostale slušaoce; `dispatch` ne obaveštava ako reducer vrati isto stanje (napisati u opisu).
- **promisify-01** — `promisify(fn)`: funkciju sa callback-om `(err, value)` kao poslednjim argumentom pretvara u funkciju koja vraća promise. Zamke: greška odbija promise; argumenti se prosleđuju redom; vrednost `undefined` je ispravan rezultat; callback pozvan sinhrono takođe radi.
- **promise-any-01** — `any(promises)`: prvo ispunjeno obećanje pobeđuje, bez upotrebe `Promise.any` (preporuka). Zamke: odbijanja se ignorišu dok ima nade; kad se sva odbiju, odbija sa `AggregateError` čije `errors` idu po redosledu ulaza; prazan niz odbija odmah; vrednosti koje nisu promise. Pisati posle `promise-race-01` i `promise-all-settled-01`.

---

## 4. Expert (5 novih)

- **my-promise-01** — `class MyPromise` sa `then`, `catch` i statičkim `resolve` i `reject`. Zamke: `then` handler se uvek poziva asinhrono (`queueMicrotask`); stanje se menja samo jednom; lanac prosleđuje vrednost i grešku kroz `then` bez handlera; greška bačena u handleru odbija sledeći promise; handler koji vrati promise (ili thenable) se odmotava; više `then` poziva nad istim promise-om. Najteži zadatak u ovom dokumentu: opis kao specifikacija, bez `Promise` u rešenju (preporuka, testovi proveravaju ponašanje).
- **json-parse-01** — `parse(text)`: podskup `JSON.parse` rekurzivnim spuštanjem, bez `JSON.parse` i `eval` (preporuka). Zamke: razmaci i novi redovi između tokena; escape sekvence `\"`, `\\`, `\n`, `A`; negativni i decimalni brojevi, eksponent; ugnježdeni prazni `[]` i `{}`; neispravan ulaz baca `SyntaxError` (zarez na kraju, nezatvoren tekst, višak posle vrednosti). Par za `json-stringify-01` iz osnovnog plana; pisati posle njega.
- **debounce-advanced-01** — `debounce(fn, ms, { leading, trailing })` sa metodama `cancel()` i `flush()`. Zamke: `leading` izvršava prvi poziv odmah; uz `leading` i `trailing` zajedno, jedan jedini poziv se izvršava samo jednom; `cancel` otkazuje zakazan poziv; `flush` ga izvršava odmah i vraća rezultat; `flush` bez zakazanog poziva ne poziva `fn`. Tajmeri po pravilu iz osnovnog plana: kratka čekanja, velika rezerva. Razlika od `debounce-01`: tamo samo osnovno ponašanje.
- **my-bind-01** — `myCall(fn, thisArg, ...args)`, `myApply(fn, thisArg, args)` i `myBind(fn, thisArg, ...preset)`, bez ugrađenih `call`, `apply` i `bind` (preporuka). Zamke: `this` je tačno prosleđeni objekat; privremeno svojstvo ne ostaje na objektu i ne sudara se sa postojećim ključem (koristiti `Symbol`); vezana funkcija pozvana sa `new` ignoriše `thisArg`, a zadati argumenti ostaju; primitivni `thisArg` (napisati u opisu šta se očekuje). Razlika od `partial-01`: ovde je tema `this`.
- **topological-sort-01** — `resolveOrder(deps)`: `deps` je objekat `{ zadatak: [od čega zavisi] }`, vraća niz u kome svaka zavisnost dolazi pre zadatka koji je traži. Zamke: ciklus baca grešku čija poruka sadrži ciklus; zavisnost koja nije ključ u `deps` se računa kao zadatak bez zavisnosti; rezultat je determinisan (među jednako dozvoljenim, redosled ključeva iz `deps`), da test može da poredi sa `toEqual`; prazan objekat daje prazan niz.

---

## 5. Redosled pisanja

Ovo je redosled kojim se zadaci **pišu**. Redosled kojim se **prikazuju** korisniku je u [plan-redosled-javascript.md](plan-redosled-javascript.md).

Grupe od 5, isti postupak i ista upozorenja o pregledu jačim modelom kao u osnovnom planu (odeljak 7). Brojač zadataka od poslednjeg pregleda je zajednički za sve planove i vodi se u tabeli osnovnog plana (odeljak 8).

1. **Grupa U (uvodna), odmah:** `safe-json-01`, `run-later-01`, `first-await-01`, `load-or-default-01`, `custom-errors-01`. Ne zavisi ni od čega i u prikazu ide prva, pa se piše pre ostatka srednjeg nivoa.
2. Preostalih 11 srednjih iz osnovnog plana (odeljak 4.1 tog plana).
3. Ostatak ovog dokumenta:
   - **Grupa A:** `unique-by-01`, `anagram-groups-01`, `set-path-01`, `immutable-update-01`, `template-01`
   - **Grupa B:** `extract-hashtags-01`, `valid-brackets-01`, `days-between-01`, `binary-search-01`, `queue-01`
   - **Grupa C:** `bank-account-01`, `create-store-01`, `promisify-01`, `promise-any-01` (4 zadatka)
4. Pet expert zadataka odavde idu kao jedna grupa, posle 11 expert zadataka iz osnovnog plana. To je expert grupa, pa posle nje obavezno ide pregled jačim modelom.

---

## 6. Stanje i izmene spiska

| Datum | Grupa | Zadaci | `npm test` | Napomena |
|---|---|---|---|---|
| | | | | |

Zamene i odustajanja od zadataka iz spiska upisivati ovde, sa razlogom.
