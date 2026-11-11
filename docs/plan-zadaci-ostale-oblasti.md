# Plan zadataka: JavaScript (srednji, expert), TypeScript i Node.js

> Dopuna dokumenta [plan-zadaci-javascript-pocetnik.md](plan-zadaci-javascript-pocetnik.md). Ovo je spisak **šta** treba napisati; **kako** se piše stoji u pravilima navedenim u odeljku 2.
> Namenjeno modelu koji piše zadatke (Sonnet) i meni za praćenje stanja.
> Dodatni JavaScript zadaci (19 srednjih, 5 expert) su u [plan-zadaci-javascript-dodatni.md](plan-zadaci-javascript-dodatni.md), a redosled prikaza u [plan-redosled-javascript.md](plan-redosled-javascript.md). Grupa U iz dodatnog plana se piše pre ostatka odeljka 4.1.
>
> Stanje na dan 2026-11-11: spisak je predlog, nijedan zadatak odavde još nije napisan.

---

## 1. Obim

| Oblast | Nivo | Postoji | Novo | Cilj |
|---|---|---|---|---|
| JavaScript | početnik | 30 | 20 | 50 (po posebnom planu, nije deo ovog dokumenta) |
| JavaScript | srednji | 4 | 16 | 20 |
| JavaScript | expert | 1 | 11 | 12 |
| TypeScript | početnik | 3 | 9 | 12 |
| TypeScript | srednji | 2 | 10 | 12 |
| TypeScript | expert | 0 | 8 | 8 |
| Node.js | početnik | 1 | 7 | 8 |
| Node.js | srednji | 1 | 9 | 10 |
| Node.js | expert | 0 | 6 | 6 |

Ukupno novih u ovom dokumentu: **76**.

**Van obima:**
- React/Next.js: čeka okruženje `iframe-react`.
- Node zadaci koji traže pravi Node (`fs`, `http`, streams): čekaju `webcontainer`. Ovde su samo zadaci čiste logike koji rade u `worker-ts`.
- Zadaci tipa `bug-hunt`: čekaju podršku u radnom ekranu.

---

## 2. Pravila

Važe sva pravila iz:
- [plan-zadaci-javascript-pocetnik.md](plan-zadaci-javascript-pocetnik.md), odeljci 3 (pravila), 4 (postupak po grupi) i 7 (dogovori o radu);
- [pravila-za-opis-zadataka.md](pravila-za-opis-zadataka.md), uključujući odeljak 7 za srednji i expert.

Pre pisanja pročitati i: `types/exercise.ts`, `lib/catalog.ts`, `lib/runner/test-lib/expect.ts` (dostupni matcheri, `.not`, `.resolves`, `.rejects`) i po jedan postojeći zadatak istog okruženja kao uzor:
- `worker`: `javascript/srednji/memoize-01.json`
- `worker-ts`: `node/srednji/retry-01.json`
- `types`: `typescript/pocetnik/my-pick-01.json`

### Dodatna pravila za ovaj dokument

**Okruženja**
- JavaScript: `runtime: "worker"`.
- TypeScript i Node sa izvršavanjem: `runtime: "worker-ts"`. Početni kod mora da se kompajlira (privremeni `return`), a da padne na testovima.
- Zadaci samo sa tipovima: `runtime: "types"`. Početni kod je `type Ime<...> = unknown;`, a testovi su `type CaseN = Expect<Equal<..., ...>>;`.
- Node zadaci koriste samo ono što postoji i u browseru i u Node-u: `URL`, `URLSearchParams`, `Request`, `Response`, `Headers`, `crypto.subtle`, `TextEncoder`, `AbortController`, `structuredClone`. Bez `require`, `import`, `fs`, `http`, `Buffer`, `process`.

**Vreme i tajmeri**
- Test ne sme da zavisi od tačnog trajanja. Kratka čekanja (10–80 ms) sa velikom rezervom, kao u `debounce-01`.
- Kad logika zavisi od trenutnog vremena (rate limiter, TTL keš, istek tokena), funkcija prima sat kao parametar (`now: () => number`), a test ga kontroliše. Bez `Date.now()` u rešenju i bez čekanja u testu.
- Bez `Math.random()` u rešenjima; ako treba slučajnost, prima se kao parametar.

**Objašnjenja (`walkthrough`)**
- Početnik: svaka linija posebno, svaki deo sintakse.
- Srednji: korak može da pokrije više linija; objašnjava se zašto, ne osnovna sintaksa.
- Expert: koraci po logičkim celinama; naglasak na kompromisima i zamkama.
- U svim nivoima i dalje važi: svaka linija koja nije prazna mora biti pokrivena nekim korakom.

**Rešenja**
- Srednji i expert: dva rešenja kad god postoje dva stvarno različita pristupa (iterativno i rekurzivno, `Map` i objekat, `async/await` i lanac promise-a).
- Tipski zadaci: jedno rešenje je dovoljno, osim kad postoji poznata alternativa.

**Tagovi**
- Koristiti postojeće iz `i18n/dictionaries/*.json`. Novi tagovi koje ovaj plan uvodi: `data-structures`, `concurrency`, `immutability`, `iterators`, `classes`, `type-guards`, `unions`, `template-literals`, `infer`, `validation`, `http`, `routing`, `security`, `middleware`. Svaki dodati u `sr.json` i `en.json` kad se prvi put upotrebi.

**Redosled prikaza.** Svaki napisan zadatak se u istoj izmeni upisuje u `content/order/<oblast>.json`, na mesto iz [plan-redosled-javascript.md](plan-redosled-javascript.md) (JavaScript: odeljci 3–5, TypeScript i Node.js: odeljak 5a). Bez toga `npm test` pada.

**Spisak je predlog, ne ugovor.** Ako se zadatak pokaže kao duplikat postojećeg, pretežak za nivo ili neproverljiv testovima, zameniti ga drugim iz iste teme i to zapisati u odeljku 8.

---

## 3. Kako čitati spisak

Svaka stavka: **id**, potpis, šta radi, pa **Zamke** (granični slučajevi koje skriveni testovi moraju da pokriju i koje opis mora da pomene). Oznaka okruženja je u naslovu grupe ili u zagradi uz zadatak.

---

## 4. JavaScript

### 4.1 Srednji (16 novih, `worker`)

Postoje: `debounce-01`, `flatten-01`, `memoize-01`, `promise-all-01`.

**Closures i funkcije**
- **throttle-01** — `throttle(fn, ms)`: prvi poziv se izvršava odmah, naredni se ignorišu dok ne prođe `ms`. Zamke: argumenti i povratna vrednost prvog poziva; posle isteka sledeći poziv opet prolazi.
- **once-01** — `once(fn)`: `fn` se izvršava samo prvi put, kasniji pozivi vraćaju isti rezultat. Zamke: rezultat `undefined` se takođe pamti; argumenti kasnijih poziva se ignorišu; dve `once` funkcije su nezavisne.
- **compose-pipe-01** — `pipe(...fns)` i `compose(...fns)`: spajanje funkcija sleva nadesno i zdesna nalevo. Zamke: bez funkcija vraća ulaz; prva funkcija prima više argumenata.
- **partial-01** — `partial(fn, ...preset)`: unapred zadati prvi argumenti. Zamke: `partial` bez unapred zadatih; ponovna upotreba iste delimične funkcije.

**Nizovi i objekti**
- **group-by-01** — `groupBy(items, keyFn)`: objekat ključ → niz elemenata. Zamke: redosled unutar grupe; prazan niz; ključ koji je broj. (Id je zauzet u TypeScript-u: koristiti `group-by-js-01`.)
- **chunk-01** — `chunk(items, size)`: niz podeljen na delove dužine `size`. Zamke: poslednji deo kraći; `size` veći od dužine; ulaz se ne menja.
- **zip-01** — `zip(a, b)`: parovi po indeksu, do dužine kraćeg niza. Zamke: različite dužine; prazan niz.
- **deep-clone-01** — `deepClone(value)`: duboka kopija objekata, nizova i `Date`. Zamke: izmena kopije ne menja original; `null`; ugnježdeni nizovi u objektima; `Date` ostaje `Date`. Preporuka u opisu: bez `structuredClone` i `JSON` trika.
- **deep-equal-01** — `deepEqual(a, b)`: strukturno poređenje. Zamke: različit redosled ključeva je jednako; `null` naspram `{}`; niz naspram objekta sa istim ključevima; `NaN` je jednak `NaN`.
- **get-path-01** — `getPath(obj, path, fallback)`: čitanje po putanji `'a.b.0.c'`. Zamke: nedostajući deo vraća `fallback`; vrednost `0`, `false` i `null` se vraćaju, a ne `fallback`.
- **pick-omit-01** — `pick(obj, keys)` i `omit(obj, keys)`. Zamke: ključ koji ne postoji; original se ne menja.
- **sort-by-01** — `sortBy(items, keyFn)`: novi sortiran niz, stabilno. Zamke: ulaz se ne menja; brojevi se ne sortiraju kao tekst; jednaki ključevi zadržavaju redosled.

**Asinhrono**
- **sleep-timeout-01** — `sleep(ms)` i `withTimeout(promise, ms)`: drugi odbija sa `Error('timeout')` ako obećanje ne stigne. Zamke: brzo obećanje prolazi; odbijeno obećanje prosleđuje svoju grešku.
- **promise-all-settled-01** — `allSettled(promises)`: kao `Promise.allSettled`, bez njegove upotrebe (preporuka). Zamke: redosled rezultata; vrednosti koje nisu promise; prazan niz.
- **promise-race-01** — `race(promises)`. Zamke: prvo odbijanje pobeđuje; vrednost koja nije promise pobeđuje odmah.
- **sequence-01** — `runInSequence(tasks)`: niz funkcija koje vraćaju promise, izvršavaju se jedna po jedna, vraća niz rezultata. Zamke: sledeća ne kreće pre kraja prethodne (test beleži redosled); greška prekida niz.

### 4.2 Expert (11 novih, `worker`)

Postoji: `curry-01`.

- **deep-equal-cycles-01** — `deepEqual(a, b)` sa kružnim referencama, `Map` i `Set`. Zamke: objekat koji sadrži sam sebe; dva različita ciklusa iste strukture; `Map` sa istim parovima drugim redom.
- **promise-pool-01** — `promisePool(tasks, limit)`: najviše `limit` istovremeno, rezultati po redosledu zadataka. Zamke: test meri najveći broj istovremenih; `limit` veći od broja zadataka; greška odbija ceo rezultat.
- **retry-backoff-01** — `retry(fn, { attempts, delayMs, sleep, signal })`: eksponencijalno čekanje; `sleep` se prosleđuje da test ne čeka. Zamke: niz čekanja `d, 2d, 4d`; prekid preko `AbortSignal`; poslednja greška se prosleđuje.
- **lru-cache-01** — `class LRUCache(capacity)` sa `get`, `set`, `has`, `size`. Zamke: `get` osvežava; `set` postojećeg ključa osvežava i ne povećava veličinu; kapacitet 1.
- **event-emitter-01** — `class EventEmitter` sa `on`, `off`, `once`, `emit`. Zamke: `off` tokom `emit`; `once` se uklanja pre poziva; isti slušalac dvaput; `emit` vraća da li je iko slušao.
- **reactive-01** — `signal(value)`, `computed(fn)`, `effect(fn)`. Zamke: `computed` se ne preračunava bez promene; efekat se pokreće jednom po promeni; zavisnosti koje se menjaju po grani uslova.
- **parse-query-nested-01** — `parseQuery('a[b]=1&x[]=2&x[]=3')` → ugnježden objekat. Zamke: nizovi sa `[]`; dekodiranje `%20` i `+`; ponovljen običan ključ postaje niz.
- **async-pipe-01** — `pipeAsync(...fns)`: funkcije mogu biti obične ili async, redom. Zamke: greška u sredini; bez funkcija vraća ulaz kao promise.
- **dedupe-requests-01** — `dedupe(fn)`: istovremeni pozivi sa istim ključem dele jedno obećanje; posle završetka sledeći poziv ide ponovo. Zamke: greška se ne kešira; različiti ključevi su nezavisni.
- **json-stringify-01** — `stringify(value)`: podskup `JSON.stringify`. Zamke: `undefined` i funkcije u objektu se preskaču, a u nizu postaju `null`; navodnici i `\n` u tekstu; `NaN` postaje `null`; `Date` preko `toJSON`.
- **range-iterator-01** — `range(start, end, step)` kao generator, lenjo. Zamke: negativan korak; `step` 0 baca grešku; radi sa `for...of` i spread-om; ne pravi ceo niz unapred (test sa ogromnim `end` uzima samo prva tri).

---

## 5. TypeScript

### 5.1 Početnik (9 novih)

Postoje: `generic-first-01`, `my-pick-01`, `my-exclude-01`.

- **typed-user-01** (`worker-ts`) — `formatUser(user: User): string`; korisnik sam piše `interface User` sa opcionim `nickname` i `readonly id`. Zamke: opciono polje nedostaje; test tipa da je `id` readonly.
- **status-union-01** (`worker-ts`) — tip `Status = 'idle' | 'loading' | 'done' | 'error'` i `statusLabel(s: Status): string` sa `switch` i granom `never`. Zamke: svaka vrednost ima oznaku; opis objašnjava čemu služi `never`.
- **type-guards-01** (`worker-ts`) — `isString(value: unknown): value is string` i `isNumberArray(value: unknown): value is number[]`. Zamke: prazan niz je niz brojeva; niz sa jednim tekstom nije; `NaN` je broj.
- **as-const-01** (`worker-ts`) — objekat `ROLES` sa `as const`, tip `Role` izveden iz njega i `isRole(value: string): value is Role`. Zamke: test tipa da je `Role` unija literala, ne `string`.
- **generic-last-01** (`worker-ts`) — `last<T>(items: T[]): T | undefined` i `wrap<T>(value: T): { value: T }`. Zamke: prazan niz; test tipa da se `T` čuva.
- **key-of-01** (`worker-ts`) — `getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`. Zamke: test tipa da je rezultat tačan tip polja, ne unija svih.
- **my-partial-01** (`types`) — `MyPartial<T>`. Zamke: prazan objekat; već opciono polje ostaje opciono.
- **my-readonly-01** (`types`) — `MyReadonly<T>` i `MyRequired<T>`. Zamke: plitko je (ugnježdeni objekat se ne menja).
- **my-record-01** (`types`) — `MyRecord<K, V>`. Zamke: ključevi unija literala; ključ `string`.

### 5.2 Srednji (10 novih)

Postoje: `deep-readonly-01`, `group-by-01`.

- **my-omit-01** (`types`) — `MyOmit<T, K>`. Zamke: više ključeva; ključ koji ne postoji u `T`.
- **my-return-type-01** (`types`) — `MyReturnType<F>` i `MyParameters<F>` preko `infer`. Zamke: funkcija bez parametara; async funkcija vraća `Promise<...>`.
- **my-awaited-01** (`types`) — `MyAwaited<T>`: odmotava ugnježdene promise. Zamke: tip koji nije promise ostaje isti; `Promise<Promise<number>>`.
- **api-state-01** (`worker-ts`) — diskriminisana unija `ApiState<T>` (`loading`, `success`, `error`) i `render(state): string`. Zamke: test tipa da `data` postoji samo u `success`.
- **typed-emitter-01** (`worker-ts`) — `class TypedEmitter<Events>`: `emit('login', payload)` prima samo payload tog događaja. Zamke: test tipa sa `// @ts-expect-error` za pogrešan payload; više slušalaca.
- **tuple-first-last-01** (`types`) — `First<T>` i `Last<T>` za tuple. Zamke: prazan tuple daje `never`; tuple sa jednim elementom.
- **tuple-to-union-01** (`types`) — `TupleToUnion<T>` i `Length<T>`. Zamke: readonly tuple; prazan tuple.
- **mutable-01** (`types`) — `Mutable<T>` (skida `readonly`) i `OptionalKeys<T>` (unija opcionih ključeva). Zamke: tip bez opcionih daje `never`.
- **typed-fetch-01** (`worker-ts`) — `parseJson<T>(text: string, guard: (v: unknown) => v is T): T`: baca grešku ako oblik nije dobar. Zamke: nevalidan JSON; validan JSON pogrešnog oblika.
- **overloads-01** (`worker-ts`) — `toArray` sa preopterećenjima: `toArray(x: string): string[]`, `toArray<T>(x: T[]): T[]`. Zamke: test tipa za oba poziva; niz se vraća kao nova kopija.

### 5.3 Expert (8 novih)

- **deep-partial-01** (`types`) — `DeepPartial<T>` uključujući nizove. Zamke: funkcije ostaju iste; niz objekata.
- **route-params-01** (`types`) — `RouteParams<'/users/:id/posts/:postId'>` → `{ id: string; postId: string }`. Zamke: ruta bez parametara daje `{}`; parametar na kraju i u sredini.
- **tuple-reverse-01** (`types`) — `Reverse<T>` i `Concat<A, B>`. Zamke: prazan tuple; tuple različitih tipova.
- **union-to-intersection-01** (`types`) — `UnionToIntersection<U>`. Zamke: jedan član; opis objašnjava kontravarijantnost parametara.
- **branded-ids-01** (`worker-ts`) — brendirani tipovi `UserId` i `OrderId` sa funkcijama za pravljenje. Zamke: `// @ts-expect-error` kad se `OrderId` prosledi tamo gde se traži `UserId`; u izvršavanju su obični stringovi.
- **typed-builder-01** (`worker-ts`) — builder koji tipom prati postavljena obavezna polja; `build()` postoji tek kad su sva postavljena. Zamke: `// @ts-expect-error` za prerani `build()`; redosled postavljanja nije bitan.
- **mini-schema-01** (`worker-ts`) — mini validator: `s.string()`, `s.number()`, `s.object({...})`, `parse(value)` i tip `Infer<typeof schema>`. Zamke: ugnježden objekat; poruka greške sadrži putanju; test tipa za `Infer`.
- **camel-case-keys-01** (`types`) — `CamelCase<'user_first_name'>` i `CamelCaseKeys<T>`. Zamke: ključ bez donje crte; više crta zaredom nije u obimu (napisati u opisu).

---

## 6. Node.js (čista logika, `worker-ts`)

### 6.1 Početnik (7 novih)

Postoji: `parse-query-01`.

- **parse-csv-01** — `parseCsv(text): Record<string, string>[]`: prvi red su nazivi kolona. Zamke: prazan tekst; prazan red na kraju; polje u navodnicima koje sadrži zarez.
- **validate-signup-01** — `validateSignup(input): { ok: true } | { ok: false; errors: Record<string, string> }`: email, lozinka (dužina, cifra), potvrda lozinke. Zamke: više grešaka odjednom; razmaci oko emaila.
- **match-route-01** — `matchRoute(pattern, path): Record<string, string> | null` za `/users/:id`. Zamke: kosa crta na kraju; različit broj delova; dekodiranje parametra.
- **env-config-01** — `loadConfig(env: Record<string, string | undefined>)`: podrazumevane vrednosti, konverzija `PORT` u broj, `DEBUG` u boolean, greška ako fali obavezna. Zamke: `PORT` koji nije broj; prazan string se računa kao nedostajući.
- **build-url-01** — `buildUrl(base, path, query)`: spajanje bez duplih kosih crta, sa kodiranjem parametara. Zamke: `undefined` vrednosti se preskaču; nizovi se ponavljaju kao `a=1&a=2`; razmak se kodira.
- **parse-cookies-01** — `parseCookies(header: string): Record<string, string>`. Zamke: razmaci posle `;`; vrednost koja sadrži `=`; prazan header; dekodiranje.
- **json-response-01** — `json(data, status = 200): Response` i `errorResponse(status, message): Response`. Zamke: zaglavlje `content-type`; telo se čita kroz `await res.json()`; status se čuva.

### 6.2 Srednji (9 novih)

Postoji: `retry-01`.

- **middleware-chain-01** — `compose(middlewares)` u stilu Koa: `(ctx, next) => Promise<void>`. Zamke: redosled pre i posle `next()`; `next()` pozvan dvaput baca grešku; greška se prenosi nagore.
- **mini-router-01** — `createRouter()` sa `get/post(path, handler)` i `handle(request: Request): Promise<Response>`. Zamke: 404 za nepoznatu putanju; 405 za poznatu putanju sa pogrešnom metodom; parametri iz putanje.
- **crud-memory-01** — handler za `/todos` nad skladištem u memoriji: `GET`, `POST`, `PUT`, `DELETE`. Zamke: 201 sa telom; 400 za loše telo; 404 za nepostojeći id; 204 bez tela.
- **paginate-01** — `paginate(items, { page, perPage, sort, order })` → `{ data, total, page, pages }`. Zamke: stranica van opsega daje prazan `data`; `perPage` ograničen na najviše 100; ulaz se ne menja.
- **http-errors-01** — klase `HttpError`, `NotFoundError`, `ValidationError` i `toResponse(error: unknown): Response`. Zamke: nepoznata greška daje 500 bez poruke iz greške; `instanceof` radi za podklase.
- **rate-limiter-01** — `createRateLimiter({ limit, windowMs, now })` → `allow(key): boolean`, fiksni prozor. Zamke: ključevi su nezavisni; novi prozor resetuje; tačno na granici prozora.
- **ttl-cache-01** — `createCache({ ttlMs, now })` sa `get`, `set`, `delete`. Zamke: istekla stavka vraća `undefined` i briše se; `set` produžava; sačuvana vrednost `undefined` naspram nepostojeće.
- **sign-token-01** — `sign(payload, secret)` i `verify(token, secret)` preko HMAC SHA-256 (`crypto.subtle`), format `base64url(payload).base64url(potpis)`. Zamke: izmenjen payload ne prolazi; pogrešan ključ; neispravan format vraća `null`, ne baca grešku.
- **hash-password-01** — `hashPassword(password, salt)` i `verifyPassword(password, stored)` preko PBKDF2 (`crypto.subtle`); `salt` se prosleđuje da test bude ponovljiv. Zamke: ista lozinka i druga so daju drugi heš; pogrešna lozinka; mali broj iteracija u testu zbog brzine (napisati u opisu da je u praksi mnogo veći).

### 6.3 Expert (6 novih)

- **job-queue-01** — `createQueue({ concurrency, retries })` sa `add(job)` i `onIdle()`. Zamke: najveći broj istovremenih; posao koji padne ponavlja se do `retries` puta; posle toga ide u listu `failed`.
- **idempotency-01** — `withIdempotency(handler, store)`: isti ključ `Idempotency-Key` vraća isti odgovor bez ponovnog izvršavanja. Zamke: istovremeni zahtevi sa istim ključem izvršavaju handler jednom; zahtev bez ključa se uvek izvršava; odgovor sa greškom 5xx se ne pamti.
- **cache-stampede-01** — `createLoader(fetchFn, { ttlMs, now })`: kad keš istekne, samo jedan poziv puni keš, ostali čekaju isti rezultat. Zamke: broj poziva `fetchFn`; greška se ne kešira; različiti ključevi.
- **sliding-window-limiter-01** — `createSlidingLimiter({ limit, windowMs, now })`: klizni prozor sa vremenskim oznakama. Zamke: zahtev tačno na isteku najstarijeg; stare oznake se čiste (test proverava veličinu preko `size(key)`).
- **token-bucket-01** — `createTokenBucket({ capacity, refillPerSec, now })` sa `take(n = 1): boolean`. Zamke: dopuna je srazmerna proteklom vremenu; ne prelazi kapacitet; `take` veći od kapaciteta je uvek `false`.
- **graceful-shutdown-01** — `createServerState()` sa `track(promise)`, `shutdown(timeoutMs, sleep)`: novi zahtevi se odbijaju, postojeći se čekaju do isteka. Zamke: `track` posle `shutdown` baca grešku; zahtev koji traje duže od isteka ne blokira; `shutdown` dvaput vraća isto obećanje.

---

## 7. Redosled rada

Grupe od 5 zadataka, kao do sada. Kad broj nije deljiv sa 5, poslednja grupa je manja. Posle svake grupe: spisak, `npm test`, potvrda.

1. JavaScript početnik: preostalih 20 (po posebnom planu).
2. JavaScript srednji: 16.
3. TypeScript početnik: 9.
4. Node.js početnik: 7.
5. TypeScript srednji: 10.
6. Node.js srednji: 9.
7. JavaScript expert: 11.
8. TypeScript expert: 8.
9. Node.js expert: 6.

Razlog: prvo se popunjavaju niži nivoi svih oblasti, da svaka oblast što pre ima dovoljno zadataka za svakodnevno vežbanje.

### Pregled jačim modelom: obavezna upozorenja

Sonnet piše zadatke. Jači model (Opus ili Fable) pregleda:
- **prvu grupu svakog novog tipa**: prvi tipski zadaci (`types`), prvi Node zadaci, prva expert grupa u svakoj oblasti;
- zatim **svakih 15–20 zadataka**;
- **svaku expert grupu TypeScript tipova** (odeljak 5.3), bez preskakanja, jer se tu očekuje najviše grešaka.

Postupak pregleda je u planu za početnike, odeljak 5.

**Model koji piše zadatke mora da upozori korisnika dva puta po grupi:**

1. **Na početku grupe**, pre pisanja, jednom rečenicom:
   - ako je ovo prva grupa novog tipa ili expert grupa: „Upozorenje: ovo je [prva grupa tipa X / expert grupa]. Posle nje treba pregled jačim modelom.“
   - inače: „Od poslednjeg pregleda jačim modelom napisano je N zadataka (pregled je na 15–20).“
2. **Na kraju grupe**, uz spisak i rezultat `npm test`, jasno izdvojeno:
   - „⚠ PREGLED POTREBAN: pokreni pregled jačim modelom u novoj sesiji pre sledeće grupe.“ kad važi neki od uslova gore ili je brojač stigao do 15;
   - „Pregled još nije potreban (N od 15–20).“ u ostalim slučajevima.

Brojač N se čita iz tabele u odeljku 8 (kolona „Pregled“) i tamo se ažurira. Model ne nastavlja na sledeću grupu posle upozorenja „PREGLED POTREBAN“ dok korisnik ne potvrdi da je pregled urađen ili da ga svesno preskače.

---

## 8. Stanje i izmene spiska

| Datum | Grupa | Zadaci | `npm test` | Pregled (od poslednjeg / urađen) | Napomena |
|---|---|---|---|---|---|
| 2026-11-11 | JS srednji, grupa 1 | `throttle-01`, `once-01`, `compose-pipe-01`, `partial-01`, `group-by-js-01` | 239 prolazi; `tsc` i lint čisti | 5 od 15–20 napisano od poslednjeg pregleda | 27 pogrešnih/alternativnih rešenja kroz `executeTests` dalo očekivan ishod; tvrdnje iz objašnjenja izvršene u Node-u; bez zamena u spisku |
| 2026-11-11 | JS početnik, grupa 5 | `word-lengths-01`, `long-words-01`, `first-adult-01`, `all-any-01`, `full-name-01` | 262 prolaze; `tsc`, lint i build čisti | 10 od 15–20 napisano od poslednjeg pregleda | 39 pogrešnih/alternativnih rešenja kroz `executeTests` dala očekivan ishod; tvrdnje iz objašnjenja izvršene u Node-u; novi tagovi `map`, `find`, `every-some`; upisani u `content/order/javascript.json`; čeka potvrdu korisnika |

Zamene i odustajanja od zadataka iz spiska upisivati ovde, sa razlogom.
