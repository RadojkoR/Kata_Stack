# Plan: Kata Stack, platforma za vežbanje JavaScript-a

> Naziv: **Kata Stack**
> Namena: lično vežbanje + portfolio projekat za AI integration pozicije
> Kasnije, ako se pokaže korisnim: otvaranje za druge korisnike

---

## 1. Vizija

Platforma na kojoj vežbam JavaScript na dva načina:

1. **Klasični zadaci**: utvrđivanje osnova i naprednih tema (nizovi, closures, async, prototipovi, DOM).
2. **Vežbanje uz AI**: veštine koje dobijaju na vrednosti kad AI piše kod: pronalaženje bagova, code review, pisanje jasnih specifikacija, čitanje tuđeg koda.

Četiri oblasti: **JavaScript**, **TypeScript**, **React/Next.js** (sa TypeScript-om) i **Node.js backend**, svaka u tri nivoa: **početnik**, **srednji**, **expert**.

**Jezici:** sajt je dvojezičan, **srpski i engleski**, od početka (sekcija 4.9). Dvojezični su i interfejs i zadaci; kod i testovi su jedni za oba jezika.

Princip: **prvo za sebe, bez razmišljanja o prodaji.** Ako mi posle nekoliko meseci stvarno koristi, razmišljam o drugim korisnicima.

---

## 2. Ciljevi

- Svakodnevno vežbanje od 20–30 minuta, bez trenja (otvorim i odmah radim).
- Da projekat u portfoliju pokaže:
  - integraciju više AI provajdera iza zajedničkog interfejsa (mentor, ocenjivanje koda),
  - bezbedno izvršavanje korisničkog koda u browseru,
  - čistu arhitekturu u Next.js + TypeScript.
- Da gradivo ostane u glavi (ponavljanje sa razmakom), a ne samo da "rešim i zaboravim".
- Da sajt i svi zadaci postoje na srpskom i engleskom (engleski je važan za portfolio i strane poslodavce).

### Van opsega (za sada)
- Nalozi, plaćanje, više korisnika
- Admin panel (zadaci su fajlovi u repou)
- Jezici osim JavaScript/TypeScript
- Jezici interfejsa osim srpskog i engleskog (struktura dozvoljava dodavanje, ali se ne radi sada)

---

## 3. Stack

| Deo | Izbor | Zašto |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Već poznato, jedan repo za frontend i API |
| Editor | Monaco Editor | Isti kao VS Code, autocomplete, markeri grešaka |
| Izvršavanje koda | Web Worker, sandboxed iframe, WebContainer (sekcija 4.3) | Bez servera; svako okruženje iza istog interfejsa |
| Transpilacija TS/JSX | esbuild-wasm ili sucrase | Prevođenje u browseru, bez servera |
| Provera tipova | Monaco TypeScript language service | Već ugrađeno u editor |
| Testovi za React | Sopstveni mini `render`/`screen`/`userEvent` ili Testing Library u iframe-u | Isti stil kao u stvarnim projektima |
| Pravi Node u browseru | WebContainer API (kasnije, opciono) | `fs`, `http`, streams bez sopstvenog servera |
| Stilovi | Tailwind CSS | Brzo prototipovanje |
| Jezici (sr/en) | `[lang]` segment u URL-u + JSON rečnici + lokalizovana polja u zadacima (sekcija 4.9) | Dva jezika od prvog dana jeftinije je nego naknadno prepravljanje |
| AI | DeepSeek i OpenAI iza `AiProvider` interfejsa (sekcija 4.7), preko Next.js API route-a | Već plaćeni API-ji; ključevi ostaju na serveru; Claude se može dodati kasnije |
| Podaci (lično korišćenje) | localStorage / IndexedDB iza `ProgressStore` | Nema backenda |
| Podaci (više korisnika) | Postgres (npr. Supabase) iza istog `ProgressStore` | Tek ako zatreba (Faza 7) |
| Hosting | Netlify (rezerva: Vercel) | Isti kod radi na obe platforme (sekcija 4.8) |

---

## 4. Arhitektura

### 4.1 Struktura sadržaja

Svaki zadatak ima po jednu vrednost na tri nezavisne ose:

| Osa | Vrednosti |
|---|---|
| **Oblast** | JavaScript, TypeScript, React/Next.js, Node.js |
| **Nivo** | početnik, srednji, expert |
| **Tip vežbe** | klasični, nađi bag, code review, popravi prompt, čitanje koda |

**Staze** su posebne: tematska lista zadataka u redosledu ("Async od nule", "Interview klasici") koja može da preseca oblasti. Na primer, staza "Async" sadrži zadatke iz JS-a i Node-a. Staza ne kopira zadatke, samo navodi njihove `id`-jeve.

**Navigacija:** oblast → tri nivoa sa napretkom u svakom → lista zadataka. Pored toga, na početnom ekranu su staze i "Danas za ponavljanje" (sekcija 5.7).

### 4.2 Slojevi aplikacije

Svaki sloj stoji iza svog interfejsa, da prelazak na više korisnika ne bi značio prepisivanje.

| Sloj | Odgovornost | Sada | Kasnije |
|---|---|---|---|
| **Sadržaj** | Učitavanje i validacija zadataka i staza | JSON fajlovi u repou + Zod | isto (ili baza) |
| **Runner** | Izvršavanje koda i testova | Adapteri po okruženju (4.3) | + serverski runner, ako zatreba |
| **Napredak** | Rešeni zadaci, pokušaji, ponavljanje, beleške | `ProgressStore` → localStorage | `ProgressStore` → Postgres |
| **AI** | Mentor i review | `AiProvider` → DeepSeek / OpenAI | + Claude ili drugi provajderi, limiti po korisniku |

```
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│                                                              │
│   UI (radni ekran, početna, staze)                           │
│        │               │                    │                │
│        ▼               ▼                    ▼                │
│   Sadržaj          Runner               ProgressStore        │
│   (JSON + Zod)     (adapteri, 4.3)      (localStorage)       │
│                                                              │
└────────────────────────────┬─────────────────────────────────┘
                             │ samo za AI funkcije
                    ┌────────▼─────────┐
                    │ /api/mentor      │──► AiProvider (DeepSeek / OpenAI)
                    │ /api/review      │
                    └──────────────────┘
```

### 4.3 Izvršavanje koda: jedan interfejs, više okruženja

UI ne zna gde se kod izvršava. Zadatak u svom fajlu kaže koje okruženje mu treba (`runtime`), a runner bira adapter.

```
              Radni ekran (UI)
                     │
             runCode(zadatak, kod)
                     │
        ┌────────────┼─────────────┬──────────────────┐
        ▼            ▼             ▼                  ▼
   Worker JS    Worker + TS     Iframe React      WebContainer
   (čist JS)    (transpile +    (komponente,      (pravi Node:
                 provera tipova) DOM, testovi)     fs, http, streams)
```

Zajednički ugovor svih adaptera:

```ts
interface Runner {
  run(input: {
    code: string;
    tests: string;
    hiddenTests?: string;
    timeoutMs?: number;
  }): Promise<RunResult>;
}

interface RunResult {
  tests: { name: string; passed: boolean; expected?: string; actual?: string; error?: string }[];
  logs: { level: "log" | "warn" | "error"; text: string }[];
  typeErrors?: { line: number; message: string }[];
  timedOut: boolean;
  durationMs: number;
}
```

| `runtime` | Okruženje | Za šta | Napomene |
|---|---|---|---|
| `worker` | Web Worker | JavaScript | Najjednostavnije; timeout preko `worker.terminate()` |
| `worker-ts` | Web Worker posle transpilacije | TypeScript, čista logika Node-a i Next.js-a | Transpilacija u browseru (esbuild-wasm ili sucrase); greške tipova iz Monaco TS language service-a |
| `types` | Samo provera tipova | Type-level TS zadaci | Nema izvršavanja; "testovi" su provere tipa (`Expect<Equal<A, B>>`), a rešenje je kad nema grešaka tipova |
| `iframe-react` | Sandboxed iframe (`sandbox="allow-scripts"`) | React komponente, DOM | Prevedena komponenta + React se ubacuju u iframe; testovi u stilu Testing Library |
| `webcontainer` | WebContainer (Node.js u browseru) | `fs`, `http`, streams, procesi | Najteže: traži cross-origin isolation headere (COOP/COEP); proveriti licencu ako projekat postane komercijalan |

**Zajednička pravila za sve adaptere:**
- **Timeout** (~3 s za Worker, duži za iframe i WebContainer): prekid izvršavanja i poruka "Moguća beskonačna petlja".
- `console.log` / `warn` / `error` se presreću i prikazuju u konzoli ispod editora.
- Korisnički kod nikad ne radi u glavnom prozoru aplikacije.

### 4.4 Šta koja oblast realno koristi

- **JavaScript** → `worker`.
- **TypeScript** → `worker-ts` za kod sa tipovima, `types` za zadatke samo sa tipovima.
- **React** → `iframe-react`.
- **Next.js** → ceo Next.js projekat se ne pokreće u browseru. Vežba se po delovima:
  - route handleri, middleware i server actions su funkcije koje primaju standardni `Request` i vraćaju `Response`, a oni postoje i u Workeru → `worker-ts`;
  - klijentske komponente → `iframe-react`.
- **Node.js** → čista logika (validacija, ruteri, servisi, JWT i heširanje preko Web Crypto) → `worker-ts`; pravi Node (`fs`, `http`, streams) → `webcontainer`.

> **Otvorena odluka:** da li za Next.js trebaju i zadaci tipa "napravi malu aplikaciju sa više stranica". To traži `webcontainer` od početka i dosta podiže složenost. Podrazumevano: **ne**, Next.js se vežba po delovima.

### 4.5 Redosled uvođenja okruženja

1. `worker` + `worker-ts` + `types`: pokriva JS, TS i čistu logiku Node-a i Next.js-a, dakle najveći deo zadataka.
2. `iframe-react`: React i klijentski deo Next.js-a.
3. `webcontainer`: tek ako zaista zatreba pravi Node.

### 4.6 Mini test biblioteka

Jednostavan `expect` API unutar okruženja, bez Jest-a:

```js
test("sabira dva broja", () => {
  expect(sum(2, 3)).toBe(5);
});
test("radi sa negativnim", () => {
  expect(sum(-1, 1)).toBe(0);
});
```

Potrebni matcheri: `toBe`, `toEqual` (duboko poređenje), `toThrow`, `resolves` (za async).
Za `iframe-react` dodatno: `render`, `screen.getByRole/getByText`, `userEvent.click/type`.
Za `types`: pomoćni tipovi `Expect` i `Equal`.

### 4.7 AI provajderi

AI sloj je iza interfejsa, isto kao `Runner` i `ProgressStore`:

```ts
interface AiProvider {
  hint(input: HintInput): Promise<HintResult>;
  review(input: ReviewInput): Promise<ReviewResult>;
}
```

- Provajder se bira preko environment varijable (`AI_PROVIDER=deepseek` ili `openai`); može i posebno za hint i review.
- **DeepSeek API je kompatibilan sa OpenAI formatom**: oba koriste isti `openai` npm paket, razlikuju se samo `baseURL`, API ključ i naziv modela. Dakle jedna implementacija sa dva podešavanja.
- **Podela posla (predlog):** DeepSeek za nagoveštaje (jeftiniji, češći pozivi), OpenAI za code review i ocenu objašnjenja (kvalitet je važniji). Za početak može i sve na jednom.
- **Strukturisani odgovori:** JSON mod oba provajdera + obavezna Zod provera odgovora, jer modeli povremeno vrate pogrešan oblik.
- **Ključevi** samo na serveru, u environment varijablama hosting platforme; nikad u klijentskom kodu.
- Claude (ili drugi provajder) kasnije = nova implementacija `AiProvider`, bez promena u ostatku aplikacije.

### 4.8 Hosting i prenosivost

Hosting je **Netlify**, a **Vercel** je rezerva. Kod je isti za obe platforme; razlike su samo u podešavanjima oko koda.

**Šta se razlikuje između platformi:**
- konfiguracioni fajl (`netlify.toml` / `vercel.json`), koji nam verovatno neće ni trebati ili će imati par linija;
- environment varijable se unose u dashboard svake platforme posebno (u kodu se čitaju isto, preko `process.env`);
- limiti funkcija (vreme izvršavanja, veličina) zavise od platforme i plana; AI odgovori se **streamuju** da ne bi udarili u limit;
- na Netlify-ju se headeri i redirecti primenjuju posle middleware-a.

**Pravila prenosivosti:**
1. Samo standardne Next.js mogućnosti, bez SDK-ova platformi (Vercel KV/Blob/Edge Config, Netlify Blobs/Forms).
2. Tajne isključivo kroz environment varijable.
3. Headeri i redirecti u `next.config`, ne u konfiguraciji platforme (izuzetak: COOP/COEP za WebContainer, ako na Netlify-ju bude potrebno u `netlify.toml`).
4. Ako zatreba baza (Faza 7), nezavisna usluga (npr. Supabase) koja radi sa obe platforme.
5. Ako koristim pnpm na Netlify-ju: podesiti hoisting (`.npmrc` ili `PNPM_FLAGS`).

**Prelazak na Vercel** ako Netlify ne radi: povežem isti GitHub repo, unesem environment varijable i deployujem.

### 4.9 Dvojezičnost (srpski i engleski)

Jezici su `sr` (podrazumevani) i `en`. Postoje tri vrste teksta i svaka se rešava drugačije:

| Vrsta teksta | Gde živi | Kako se prevodi |
|---|---|---|
| **Interfejs** (dugmad, naslovi, poruke) | `i18n/dictionaries/sr.json` i `en.json` | Rečnik sa ključevima; funkcija `t("ključ")`. Test pada ako jedan rečnik ima ključ koji drugi nema |
| **Sadržaj zadataka i staza** (naslov, opis, kontekst, objašnjenje baga, napomene uz rešenja, imena testova) | JSON u `content/` | Svako tekstualno polje je objekat `{ "sr": "...", "en": "..." }`. Zod šema traži oba jezika, pa **build pada** ako jedan fali |
| **Poruke runnera i greške** | `lib/runner` | Runner ne vraća gotove rečenice, nego kodove i parametre (npr. `timeout`, `hidden-test`); UI ih prevodi. Poruke samog JavaScript-a (`TypeError: ...`) ostaju kakve jesu |

**Šta se ne prevodi:** kod (`starterCode`, `buggyCode`, rešenja), testovi i tagovi. Tag je neutralan slug (`closures`), a njegov prikazani naziv je u rečniku. Imena testova mogu biti obični string ili `{ sr, en }`.

**Routing:** `/sr/...` i `/en/...` (segment `app/[lang]`), `generateStaticParams` za oba jezika, a `proxy.ts` preusmerava `/` na izabrani jezik. Redosled određivanja jezika: cookie `ks_lang` → `Accept-Language` → `sr`. Prebacivač jezika (SR | EN) je u zaglavlju i pamti izbor. `<html lang>` se postavlja iz segmenta.

**AI:** zahtevi za mentora i review nose `lang`, a prompt traži odgovor na tom jeziku (sekcija 8). Ocena objašnjenja baga poredi tekst sa referencom bez obzira na jezik.

**Baza (Etapa 2):** `users.locale` čuva izbor prijavljenog korisnika. Napredak ne zavisi od jezika (vezan je za `exercise_id`).

**Posao oko prevoda:** AI napravi nacrt engleske (ili srpske) verzije svakog zadatka, a ja ga proverim. Pravilo je da zadatak ne ulazi u repo dok nema oba jezika.

---

## 5. UI/UX i editor

### 5.1 Editor (Monaco)

Monaco je isto jezgro editora na kojem radi VS Code, pokrenuto u browseru. Za JS/TS daje praktično isto iskustvo kucanja kao VS Code.

**Dobija se odmah:**
- isticanje sintakse i teme (tamna, svetla, sopstvena),
- autocomplete (IntelliSense) za JS/TS i ugrađene API-je (`arr.` → lista metoda sa opisima),
- crvene talasaste linije za greške i upozorenja dok kucam,
- prečice: multi-cursor (Alt+klik), Ctrl+D, Ctrl+F (pretraga i zamena), F2 (preimenovanje), F1 (command palette),
- sklapanje blokova, minimapa, uparivanje zagrada, automatsko uvlačenje.

**Dodaje se lako:**
- **Prettier**: formatiranje na Shift+Alt+F ili na čuvanje,
- **Vim prečice** (`monaco-vim`), opciono,
- **tipovi za pomoćne funkcije zadatka** (`test`, `expect`), da i one imaju autocomplete.

**Ne postoji (to je ostatak VS Code-a, ne editor):**
- ekstenzije iz marketplace-a,
- terminal i Git,
- debugger sa breakpointima (`console.log` radi; za ozbiljnije: `debugger;` + DevTools browsera),
- npm paketi (za vežbanje JS-a nisu potrebni; ako zatreba, preko CDN-a),
- file explorer: zadatak je jedan fajl (Monaco podržava više tabova ako kasnije zatreba).

### 5.2 Raspored radnog ekrana

Tri kolone: zadatak levo (čita se prvi), editor u sredini, povratna informacija desno.

```
┌───────────────────────────────────────────────────────────────────┐
│ ← Nazad   Debounce (Async staza 3/8)    ⏱ 04:12    ▶ Run  ✓ Submit│
├──────────────┬──────────────────────────────┬─────────────────────┤
│ [Zadatak]    │                              │ [Testovi] [Mentor]  │
│ [Rešenja]    │                              │ [Review]            │
│ [Beleške]    │        EDITOR (Monaco)       │                     │
│              │                              │ ✓ poziva jednom     │
│ Opis         │                              │ ✗ prosleđuje args   │
│ Primeri      │                              │   očekivano: [1,2]  │
│ Ograničenja  │                              │   dobijeno: []      │
│ ●●●○○ tagovi │──────────────────────────────│ ○ skriveni (3)      │
│              │ Konzola  > console.log izlaz │ 💡 Treba pomoć?     │
└──────────────┴──────────────────────────────┴─────────────────────┘
```

**Gornja traka:** nazad, naziv zadatka, pozicija u stazi, tajmer, dugmad **Run**, **Submit**, Reset, Format.

**Levo: zadatak (tabovi)**
- **Zadatak**: opis, primeri ulaza/izlaza, ograničenja, težina, tagovi.
- **Rešenja**: zaključano dok ne rešim; posle toga "napiši pa uporedi" sa 2–3 pristupa.
- **Beleške**: moje beleške uz zadatak, da vidim šta me je zbunilo kad mi se vrati na ponavljanje.

**Sredina: editor + konzola**
- Konzola je uska traka ispod editora koja se može sklopiti (`console.log` blizu koda).
- **Run** pokreće vidljive testove; **Submit** pokreće i skrivene testove i računa se kao rešenje.

**Desno: povratna informacija (tabovi)**
- **Testovi**: pre pokretanja siva lista; posle zeleni/crveni sa "očekivano/dobijeno". Klik na pali test označava relevantnu liniju u editoru.
- **Mentor**: tri nivoa pomoći (nagoveštaj → pristup → rešenje), uz upozorenje da treći nivo skraćuje interval ponavljanja.
- **Review**: pojavljuje se tek posle uspešnog Submit-a, zajedno sa ocenom težine (lako / dobro / teško / nisam znao).

### 5.3 Prečice

| Prečica | Akcija |
|---|---|
| Ctrl+Enter | Run |
| Ctrl+Shift+Enter | Submit |
| Shift+Alt+F | Formatiranje (Prettier) |
| Prečica za fokus mod (npr. Ctrl+Shift+F) | Sklapa obe strane, ostaje samo editor |

### 5.4 Ponašanje panela
- Paneli se razvlače i sklapaju (`react-resizable-panels`).
- **Fokus mod**: ostaje samo editor, za razmišljanje bez ometanja.
- Tamna tema je podrazumevana; raspored panela i tema se pamte (localStorage).
- Prebacivač jezika **SR | EN** je u gornjoj traci i na početnom ekranu; izbor se pamti (cookie `ks_lang`).

### 5.5 Raspored po tipu vežbe
Struktura ostaje ista, menja se sadržaj panela:

| Tip | Levo | Sredina | Desno |
|---|---|---|---|
| Klasični | Opis zadatka | Editor + konzola | Testovi / Mentor / Review |
| Nađi bag | Kontekst ("AI je napisao, testovi povremeno padaju") | Editor + polje **"Objasni uzrok"** pored konzole | Testovi + AI ocena objašnjenja; Submit nije moguć bez objašnjenja |
| Čitanje koda | Uputstvo | Editor samo za čitanje | Pitanja na koja odgovaram + tajmer |
| Popravi prompt | **Ja pišem specifikaciju** | AI generisan kod, samo za čitanje | Da li generisani kod prolazi testove |
| Code review | Opis šta kod treba da radi | AI kod sa komentarima po linijama (kao GitHub PR) | Poređenje mog review-a sa referentnim |

### 5.6 Manji ekrani
- **Laptop (uži ekran)**: opcija sa dve kolone, zadatak gore iznad editora, rezultati desno.
- **Mobilni**: tri taba (Zadatak / Kod / Rezultati). Realno, alat je za desktop; mobilni je samo za pregled.

---

### 5.7 Početni ekran i navigacija

```
┌──────────────────────────────────────────────────────────────┐
│ Kata Stack                           🔥 serija: 6 dana        │
├──────────────────────────────────────────────────────────────┤
│ Danas za ponavljanje: 4 zadatka              [ Kreni ▶ ]     │
├──────────────────────────────────────────────────────────────┤
│ Oblasti                                                      │
│  JavaScript     početnik ████████░░  srednji ███░░░  expert ░│
│  TypeScript     početnik ████░░░░░░  srednji ░░░░░░  expert ░│
│  React/Next.js  početnik ░░░░░░░░░░  ...                     │
│  Node.js        početnik ██░░░░░░░░  ...                     │
├──────────────────────────────────────────────────────────────┤
│ Staze: Async od nule (3/8) · Interview klasici (0/12)        │
└──────────────────────────────────────────────────────────────┘
```

- Klik na oblast i nivo → lista zadataka sa filterom po tipu vežbe i tagu.
- Oblasti čije okruženje još nije gotovo (npr. React pre Faze 3) prikazuju se kao "uskoro".

---

## 6. Format zadataka

Svaki zadatak je jedan fajl u `content/exercises/`.

### Klasični zadatak
```json
{
  "id": "debounce-01",
  "title": { "sr": "Napiši sopstveni debounce", "en": "Write your own debounce" },
  "type": "classic",
  "area": "javascript",
  "level": "srednji",
  "runtime": "worker",
  "tags": ["closures", "timers", "interview"],
  "description": {
    "sr": "Napiši funkciju debounce(fn, ms) koja ...",
    "en": "Write a debounce(fn, ms) function that ..."
  },
  "starterCode": "function debounce(fn, ms) {\n  // tvoj kod\n}",
  "tests": "test({ sr: 'poziva fn samo jednom', en: 'calls fn only once' }, async () => { ... });",
  "hiddenTests": "test('prosleđuje argumente', ...)",
  "solutions": [
    {
      "label": { "sr": "Klasičan pristup", "en": "Classic approach" },
      "code": "...",
      "note": { "sr": "...", "en": "..." }
    }
  ]
}
```

### Zadatak "Nađi bag"
```json
{
  "id": "bug-async-loop-01",
  "type": "bug-hunt",
  "title": { "sr": "Zašto se korisnici učitavaju pogrešnim redom?", "en": "Why do users load in the wrong order?" },
  "area": "javascript",
  "level": "srednji",
  "runtime": "worker",
  "tags": ["async", "race-condition"],
  "context": {
    "sr": "AI je napisao ovu funkciju. Testovi u CI-ju povremeno padaju.",
    "en": "An AI wrote this function. The tests in CI fail intermittently."
  },
  "buggyCode": "...",
  "tests": "...",
  "bugExplanation": {
    "sr": "forEach ne čeka async callback ...",
    "en": "forEach does not wait for an async callback ..."
  }
}
```

Polja koja određuju gde zadatak pripada:

| Polje | Vrednosti |
|---|---|
| `area` | `javascript`, `typescript`, `react-next`, `node` |
| `level` | `pocetnik`, `srednji`, `expert` (u fajlovima bez dijakritika: `pocetnik`) |
| `type` | `classic`, `bug-hunt`, `code-review`, `fix-the-prompt`, `code-reading` |
| `runtime` | `worker`, `worker-ts`, `types`, `iframe-react`, `webcontainer` |

### Staza
```json
{
  "id": "async-od-nule",
  "title": { "sr": "Async od nule do Promise.all", "en": "Async from zero to Promise.all" },
  "exercises": ["callbacks-01", "promise-basics-01", "debounce-01", "promise-all-01", "node-retry-01"]
}
```

**Lokalizovana polja:** svako tekstualno polje koje korisnik čita (`title`, `description`, `context`, `bugExplanation`, `label` i `note` uz rešenja, naslov staze) je objekat `{ "sr": "...", "en": "..." }` i mora imati oba jezika. Kod, testovi i tagovi nisu lokalizovani. Vidi sekciju 4.9.

Ocenjivanje bug-hunt zadatka:
1. Popravljen kod mora da prođe testove (automatski).
2. Pisano objašnjenje ocenjuje AI u poređenju sa `bugExplanation` (da li sam pogodio uzrok, a ne samo simptom).

---

## 7. Tipovi vežbi

### Klasični
- **Zadatak + testovi**: osnovni tip.
- **Napiši pa uporedi**: posle rešenja prikažu se 2–3 pristupa sa kompromisima.

### Vežbanje uz AI
- **Nađi bag**: kod izgleda ispravno, a ima suptilnu grešku (race condition, edge case, mutacija, curenje memorije, `this`, poređenje tipova).
- **Code review**: dobijem AI rešenje, napišem review, pa AI uporedi moj review sa referentnim.
- **Popravi prompt**: AI je dao loše rešenje za nejasnu specifikaciju; prepišem specifikaciju, pa se proveri da li nova daje kod koji prolazi testove.
- **Čitanje koda**: nepoznat kod od 50–150 linija i pitanja o njemu ("šta vraća za X?", "gde bi dodao keširanje?"), sa vremenskim ograničenjem.

---

## 8. AI mentor

Endpoint `/api/mentor` sa tri nivoa pomoći (svaki sledeći se otključava tek posle prethodnog):

1. **Nagoveštaj**: usmerenje bez koda ("Razmisli šta se dešava sa `i` kad se callback izvrši").
2. **Pristup**: opis algoritma rečima.
3. **Rešenje sa objašnjenjem**: poslednja opcija; zadatak se tada beleži kao "rešen uz pomoć" i češće se vraća na ponavljanje.

Endpoint `/api/review` posle uspešnog rešenja:
- čitljivost, imenovanje, edge case-ovi, složenost,
- kratko i konkretno (max 5 tačaka),
- bez pohvala radi pohvala.

Pravila za prompt:
- AI dobija opis zadatka, testove i moj kod, ali **ne i referentno rešenje** u nivou 1 i 2 (da ne "procuri").
- Odgovor u strukturisanom JSON-u radi lakšeg prikaza.
- Ograničenje broja poziva po danu (kontrola troška).
- Zahtev nosi `lang` (`sr` ili `en`), a prompt traži odgovor na tom jeziku; kod i identifikatori ostaju neprevedeni.

---

## 9. Ponavljanje sa razmakom

Pojednostavljen SM-2 algoritam:
- Posle rešenja ocenim težinu: **lako / dobro / teško / nisam znao**.
- Na osnovu ocene i istorije računa se sledeći datum ponavljanja.
- Početni ekran: "Danas za ponavljanje: N zadataka" + "Novi zadaci".
- Zadatak rešen uz pomoć mentora automatski dobija kraći interval.

---

## 10. Struktura projekta

```
kata-stack/
├── app/
│   ├── [lang]/                  # sr | en
│   │   ├── page.tsx             # početna: danas, staze, statistika
│   │   ├── exercise/[id]/page.tsx   # radni ekran
│   │   └── tracks/[slug]/page.tsx   # tematske staze
│   └── api/
│       ├── mentor/route.ts
│       └── review/route.ts
├── components/
│   ├── layout/
│   │   ├── Workspace.tsx        # tri kolone, resizable paneli, fokus mod
│   │   └── TopBar.tsx           # naziv, tajmer, Run / Submit
│   ├── left/
│   │   ├── TaskPanel.tsx        # opis, primeri, tagovi
│   │   ├── SolutionsPanel.tsx   # "napiši pa uporedi"
│   │   └── NotesPanel.tsx
│   ├── center/
│   │   ├── Editor.tsx           # Monaco + Prettier + tipovi
│   │   ├── OutputConsole.tsx
│   │   └── ExplainBox.tsx       # "Objasni uzrok" za bug-hunt
│   └── right/
│       ├── TestResults.tsx
│       ├── MentorPanel.tsx
│       ├── ReviewPanel.tsx      # review + ocena težine
│       └── QuestionsPanel.tsx   # za čitanje koda
├── lib/
│   ├── runner/
│   │   ├── types.ts             # Runner, RunResult (ugovor iz 4.3)
│   │   ├── index.ts             # runCode(): bira adapter po `runtime`
│   │   ├── test-lib/            # test, expect, Expect/Equal, render/screen
│   │   └── adapters/
│   │       ├── worker.ts        # čist JS
│   │       ├── worker-ts.ts     # transpile + Worker
│   │       ├── types-only.ts    # samo provera tipova
│   │       ├── iframe-react.ts  # Faza 3
│   │       └── webcontainer.ts  # Faza 6 (opciono)
│   ├── storage/
│   │   ├── ProgressStore.ts     # interfejs
│   │   └── localStorageStore.ts # implementacija za lično korišćenje
│   ├── ai/
│   │   ├── AiProvider.ts        # interfejs (sekcija 4.7)
│   │   ├── openaiCompatible.ts  # jedna implementacija za OpenAI i DeepSeek
│   │   ├── prompts.ts           # promptovi za hint i review
│   │   └── schemas.ts           # Zod šeme odgovora
│   ├── srs.ts                   # ponavljanje sa razmakom
│   └── content.ts               # učitavanje + Zod validacija zadataka i staza
├── content/
│   ├── exercises/
│   │   ├── javascript/{pocetnik,srednji,expert}/*.json
│   │   ├── typescript/{pocetnik,srednji,expert}/*.json
│   │   ├── react-next/{pocetnik,srednji,expert}/*.json
│   │   └── node/{pocetnik,srednji,expert}/*.json
│   └── tracks/*.json
├── i18n/
│   ├── config.ts                # jezici, podrazumevani jezik
│   ├── localized.ts             # LocalizedString + pomoćna funkcija za izbor jezika
│   └── dictionaries/{sr,en}.json
├── proxy.ts                     # preusmerava / na /sr ili /en
└── types/
    └── exercise.ts
```

---

## 11. Faze razvoja

### Faza 0: Postavka
- [ ] Next.js + TypeScript + Tailwind projekat
- [ ] Repo na GitHubu, deploy na Netlify
- [ ] Environment varijable: `AI_PROVIDER`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`
- [ ] Tipovi `Exercise` i `Track` + Zod validacija fajlova
- [ ] Interfejsi `Runner` i `ProgressStore` (pre bilo koje implementacije)
- [ ] Struktura foldera `content/` po oblastima i nivoima
- [ ] Dvojezičnost (sekcija 4.9): `[lang]` segment, rečnici `sr`/`en`, lokalizovana polja u šemi zadatka, prebacivač jezika

### Faza 1: MVP (cilj: mogu da vežbam svaki dan)
- [ ] Raspored u tri kolone sa resizable panelima (sekcija 5.2)
- [ ] Monaco editor + Prettier + tipovi za `test`/`expect` (sekcija 5.1)
- [ ] Prečice Ctrl+Enter / Ctrl+Shift+Enter, fokus mod, tamna tema
- [ ] Pamćenje rasporeda panela i teme
- [ ] Adapteri `worker`, `worker-ts` i `types` sa timeoutom
- [ ] Mini test biblioteka (`test`, `expect`, `Expect`/`Equal`)
- [ ] Prikaz rezultata testova, grešaka tipova i console izlaza
- [ ] `localStorageStore` (rešeno / pokušaji / vreme / beleške)
- [ ] Početni ekran sa oblastima i nivoima (sekcija 5.7)
- [ ] **Prvih 15 zadataka**: JavaScript, TypeScript i čista logika Node-a (svaki na srpskom i engleskom)
- [ ] Lista zadataka sa filterom po tipu i tagu

### Faza 2: AI mentor
- [ ] `/api/mentor` sa 3 nivoa pomoći
- [ ] `/api/review` posle uspešnog rešenja
- [ ] Ograničenje poziva po danu
- [ ] Beleženje "rešeno uz pomoć"
- [ ] Mentor i review odgovaraju na jeziku interfejsa (`lang` u zahtevu)

### Faza 3: React i Next.js
- [ ] Adapter `iframe-react` (transpile JSX/TSX, React u iframe-u, timeout)
- [ ] `render` / `screen` / `userEvent` u test biblioteci
- [ ] React zadaci za sva tri nivoa
- [ ] Next.js zadaci po delovima: route handleri, middleware, server actions (`worker-ts`)

### Faza 4: Vežbanje uz AI
- [ ] Tip zadatka `bug-hunt` + AI ocena objašnjenja
- [ ] **"Nađi bag" zadaci** za svaku oblast i nivo
- [ ] Tip `code-review`
- [ ] Tip `fix-the-prompt`
- [ ] Tip `code-reading` sa tajmerom

### Faza 5: Utvrđivanje i staze
- [ ] SM-2 ponavljanje + ekran "Danas"
- [ ] Tematske staze preko oblasti (npr. "Async od nule do Promise.all", "Interview klasici")
- [ ] "Napiši pa uporedi" prikaz rešenja
- [ ] Statistika: serija dana, jake i slabe teme, napredak po oblasti i nivou

### Faza 6 (opciono): Pravi Node.js
Samo ako čista logika u Workeru nije dovoljna.
- [ ] Adapter `webcontainer` + COOP/COEP headeri
- [ ] Node zadaci sa `fs`, `http`, streams
- [ ] Odluka o Next.js "mini aplikacija" zadacima (sekcija 4.4)

### Faza 7 (opciono): Više korisnika
Samo ako faze 1–5 pokažu da je alat koristan.
- [ ] Autentifikacija
- [ ] Postgres implementacija `ProgressStore`
- [ ] Server-side validacija rešenja (da se ne može varati preko klijenta)
- [ ] Ograničenja AI troška po korisniku
- [ ] Provera licence za WebContainer, ako se koristi
- [ ] Odluka o modelu: besplatno / freemium / jednokratna kupovina

---

## 12. Portfolio vrednost

Šta projekat pokazuje poslodavcu za AI integration poziciju:
- **LLM integracija u proizvod**: strukturisani izlaz, promptovi po nivoima, kontrola troška.
- **AI kao ocenjivač**: poređenje slobodnog teksta sa referencom (evaluacija).
- **Bezbednost**: izvršavanje nepouzdanog koda u sandboxu.
- **Dizajn proizvoda**: jasna ideja zašto ova platforma postoji u svetu gde AI piše kod.

Za README: kratak demo GIF, objašnjenje arhitekture i sekcija "Šta sam naučio".

---

## 13. Rizici

| Rizik | Kako ga ublažiti |
|---|---|
| Pisanje zadataka oduzima više vremena od samog koda | AI generiše nacrt zadatka, ja ga proveravam i dorađujem |
| AI mentor previše pomaže | Nivoi pomoći + bez referentnog rešenja u prva dva nivoa |
| Trošak API-ja | Dnevni limit, keširanje review-a za isti kod |
| Projekat se razvuče i ne koristim ga | Faza 1 mora biti upotrebljiva sama za sebe; ostalo tek posle |
| Beskonačna petlja zamrzne tab | Worker + timeout + `terminate()` |
| Next.js i Node ne mogu potpuno u browseru | Vežbanje po delovima preko standardnih `Request`/`Response`; WebContainer tek u Fazi 6 |
| Previše okruženja odjednom | Jedan `Runner` interfejs; okruženja se uvode jedno po jedno (sekcija 4.5) |
| WebContainer traži posebne headere i licencu za komercijalnu upotrebu | Opciono, tek kad zatreba; proveriti uslove pre Faze 7 |
| Prevođenje udvostručuje posao oko svakog zadatka | AI pravi nacrt drugog jezika, ja proveravam; zadatak bez oba jezika ne prolazi build |
| Poruke na jednom jeziku "procure" u kod runnera ili AI-ja | Runner vraća kodove, ne rečenice; `lang` ide u svaki AI zahtev |

---

## 14. Kako znam da radi

- Vežbam bar 4–5 dana nedeljno, mesec dana zaredom.
- Zadaci sa ponavljanja se rešavaju brže i sa manje pomoći mentora.
- U "nađi bag" zadacima pogađam uzrok, a ne samo simptom.
- Projekat je na GitHubu sa čistim README-om i živim demoom.
