# Kata Stack: koraci za programiranje

> Dopuna dokumenta [plan-js-platforma.md](plan-js-platforma.md). Tamo je opisano **šta** pravimo (vizija, UI, tipovi vežbi, runner, AI), a ovde **kako i kojim redom**: od praznog foldera do aplikacije koja radi na Netlify-ju sa bazom na Supabase-u.
>
> Aplikacija se pravi u dve etape:
> 1. **Etapa 1 (MVP):** napredak u localStorage-u, bez baze i bez prijave. Cilj je da što pre počnem da vežbam i da proverim najteži deo (runner i editor).
> 2. **Etapa 2:** Postgres na Supabase-u (klasičan SQL, bez Prisma-e) i prijava, **pre AI mentora**, jer AI endpointi ne smeju biti javni bez prijave i dnevnog limita na serveru.

---

## 1. Ključne odluke

| Tema | Odluka | Zašto |
|---|---|---|
| Frontend + backend | Next.js (App Router) + TypeScript, jedan repo | Route handleri **jesu** Node.js backend; poseban Express server nije potreban |
| Hosting aplikacije | Netlify (rezerva: Vercel) | Next.js radi bez dodatne konfiguracije; route handleri postaju Netlify Functions |
| Napredak u Etapi 1 | localStorage iza `ProgressStore` interfejsa + izvoz/uvoz JSON-a | Bez backend-a do prvog vežbanja; JSON je i backup i put do baze |
| Napredak u Etapi 2 | Postgres na Supabase-u | Besplatan plan, upravljani backup-i, pooler za serverless |
| Šta od Supabase-a koristimo | **Samo Postgres** (connection string) | Bez Supabase Auth-a i `supabase-js` klijenta; prelazak na drugi Postgres (Neon, Railway, sopstveni) = promena jedne env varijable |
| Pristup bazi | `postgres` (postgres.js) sa tagged template upitima | Klasičan SQL; parametri se automatski escape-uju, nema ručnog spajanja stringova |
| Migracije | Numerisani `.sql` fajlovi + sopstvena skripta od ~30 linija | Bez ORM-a i bez alata koji veže za jednu platformu |
| Prijava (Etapa 2) | Sopstvena: `scrypt` (ugrađen u Node) + tabela `sessions` + httpOnly cookie | Bez dodatnih zavisnosti; jasno šta se dešava |
| Validacija | Zod za fajlove zadataka, localStorage podatke, uvoz JSON-a i svaki ulaz u API | Jedan alat za sve granice gde podaci ulaze u aplikaciju |
| Sadržaj (zadaci, staze) | JSON fajlovi u repou | Verzionisano u Git-u; napredak samo pokazuje na `exercise_id` |
| Jezici | Srpski i engleski od početka: `[lang]` segment u URL-u, JSON rečnici, lokalizovana polja `{ sr, en }` u zadacima | Dva jezika od prvog dana jeftinije je nego naknadno prepravljanje; detalji u [plan-js-platforma.md](plan-js-platforma.md), sekcija 4.9 |
| Poruke runnera | Kodovi i parametri, ne gotove rečenice | Da isti runner radi za oba jezika; prevodi ih UI |
| AI | Tek posle Etape 2 | Ključevi se ne stavljaju na Netlify dok ne postoje prijava i limit |

**Zašto ne poseban Node/Express server:** Netlify ne pokreće server koji stalno radi, nego funkcije koje se pale po zahtevu. Next.js route handleri se deploy-uju upravo kao takve funkcije i rade na Node runtime-u, tako da pišemo pravi Node.js kod (`node:crypto`, SQL upiti) bez zasebnog hostinga. Ako jednog dana zatreba stalni server (WebSocket, dugi poslovi), to bi išlo na Render/Railway/Fly, ali za ovu aplikaciju nije potrebno.

---

## 2. Arhitektura

### Etapa 1

```
┌────────────────────────── Browser ───────────────────────────┐
│  UI (Next.js stranice, Monaco)                               │
│  Runner (Worker / iframe): izvršava kod                      │
│  ProgressStore → localStorageStore                           │
│  localStorage: napredak, beleške, nacrt koda, tema, paneli   │
└───────────────┬──────────────────────────────────────────────┘
                │ samo učitavanje stranica
┌───────────────▼────────────── Netlify ───────────────────────┐
│  Next.js (stranice + /api/health)                            │
│  Nema baze, nema API ključeva                                │
└──────────────────────────────────────────────────────────────┘
```

### Etapa 2

```
┌────────────────────────── Browser ───────────────────────────┐
│  UI (Next.js stranice, Monaco)                               │
│  Runner (Worker / iframe): izvršava kod, nikad na serveru    │
│  ProgressStore → apiProgressStore                            │
│  localStorage: samo tema, paneli i nacrt koda                │
└───────────────┬──────────────────────────────────────────────┘
                │ fetch /api/*  (cookie sa sesijom)
┌───────────────▼────────────── Netlify ───────────────────────┐
│  Next.js route handleri (Node runtime = Netlify Functions)   │
│   /api/auth/*      prijava, odjava                           │
│   /api/progress/*  pokušaji, rešenja, beleške, SRS, uvoz     │
│   /api/mentor      ─┐                                        │
│   /api/review      ─┴─► AiProvider ──► DeepSeek / OpenAI     │
│                                                              │
│  lib/db (postgres.js, ručno pisan SQL)                       │
└───────────────┬──────────────────────────────────────────────┘
                │ DATABASE_URL (transaction pooler, port 6543)
┌───────────────▼────────────── Supabase ──────────────────────┐
│  Postgres: users, sessions, attempts, exercise_progress,     │
│            ai_usage, ai_review_cache, schema_migrations      │
└──────────────────────────────────────────────────────────────┘
```

Pravila:
- UI zna samo za `ProgressStore` interfejs; prelazak iz Etape 1 u Etapu 2 menja jednu liniju koja bira implementaciju.
- Browser **nikad** ne razgovara direktno sa bazom niti sa AI provajderom.
- Korisnički kod se izvršava samo u browseru; server samo čuva rezultat.
- Svaki upit koji čita ili menja napredak ima `where user_id = ${userId}`, i kad je korisnik samo jedan.

---

## 3. Etapa 1: localStorage

### 3.1 Oblik podataka

Podaci u localStorage-u imaju **isti oblik kao tabele iz Etape 2** (samo camelCase), da bi uvoz u bazu bio prepisivanje polje po polje.

```ts
// types/progress.ts
export type ExerciseProgress = {
  exerciseId: string;
  status: "in_progress" | "solved" | "solved_with_help";
  solvedAt?: string;         // ISO datum
  bestTimeMs?: number;
  hintLevel: 0 | 1 | 2 | 3;
  notes?: string;
  // SM-2 (koristi se od Faze 5, ali polja postoje od početka)
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt?: string;
  lastGrade?: "lako" | "dobro" | "tesko" | "nisam_znao";
  updatedAt: string;
};

export type Attempt = {
  exerciseId: string;
  kind: "run" | "submit";
  passed: boolean;
  durationMs: number;
  code: string;
  createdAt: string;
};

export type ProgressExport = {
  version: 1;
  exportedAt: string;
  progress: ExerciseProgress[];
  attempts: Attempt[];
};
```

### 3.2 Ključevi

| Ključ | Sadržaj |
|---|---|
| `ks:v1:progress` | `Record<exerciseId, ExerciseProgress>` |
| `ks:v1:attempts` | `Attempt[]`, samo poslednjih 20 po zadatku (localStorage ima limit od ~5 MB) |
| `ks:v1:draft:<exerciseId>` | nesačuvan kod u editoru |
| `ks:ui` | tema, raspored panela (jezik je u URL-u i u cookie-ju `ks_lang`, ne ovde) |

- `v1` u ključu omogućava da se oblik podataka kasnije promeni bez lomljenja starih podataka (čitač prepozna `v1` i prevede ga).
- Sve što se čita iz localStorage-a prolazi kroz Zod šemu; nevalidan podatak se ne briše tiho, nego se prijavi u konzoli i preskoči.

### 3.3 Izvoz i uvoz

- Stranica **Podešavanja** sa dugmadima **Izvezi JSON** (preuzima `kata-stack-YYYY-MM-DD.json` u obliku `ProgressExport`) i **Uvezi JSON**.
- Uvoz prvo validira fajl Zod-om, pa pita: "zameni sve" ili "spoji" (za isti zadatak pobeđuje noviji `updatedAt`).
- Isti fajl se u Etapi 2 šalje na `/api/progress/import` i tako napredak prelazi u bazu.
- Navika: izvoz jednom nedeljno, dok traje Etapa 1.

---

## 4. Etapa 2: baza podataka

### 4.1 Konekcije

Supabase daje tri connection stringa. Koristimo dva:

| Varijabla | Supabase konekcija | Port | Za šta |
|---|---|---|---|
| `DATABASE_URL` | Transaction pooler (Supavisor) | 6543 | Aplikacija na Netlify-ju (puno kratkih konekcija iz funkcija) |
| `DATABASE_URL_MIGRATIONS` | Session pooler | 5432 | Migracije i skripte sa mog računara |

- Direktna konekcija (`db.<projekat>.supabase.co`) je samo IPv6, pa je ne koristimo; session pooler radi preko IPv4.
- Transaction pooler ne podržava prepared statements, pa klijent mora imati `prepare: false`.
- Lozinka baze sa specijalnim znakovima (`@`, `#`, `/`...) mora biti URL-enkodovana u connection stringu.
- Lokalno su obe varijable ista adresa lokalnog Postgres-a.

### 4.2 Klijent

`lib/db/client.ts`:

```ts
import "server-only";
import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    max: 1,            // jedna konekcija po instanci funkcije; pooler radi ostalo
    prepare: false,    // obavezno za transaction pooler
    idle_timeout: 20,
  });

// u dev modu hot reload ne pravi novu konekciju pri svakoj izmeni
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
```

### 4.3 Upiti

Svi upiti žive u `lib/db/queries/*.ts`, po jedna datoteka po temi. Komponente i route handleri ne pišu SQL direktno.

```ts
// lib/db/queries/progress.ts
import { sql } from "../client";

export async function getDueExercises(userId: string) {
  return sql<{ exercise_id: string; due_at: Date }[]>`
    select exercise_id, due_at
    from exercise_progress
    where user_id = ${userId} and due_at <= now()
    order by due_at
  `;
}

export async function recordAttempt(a: {
  userId: string; exerciseId: string; kind: "run" | "submit";
  passed: boolean; durationMs: number; code: string;
}) {
  await sql`
    insert into attempts (user_id, exercise_id, kind, passed, duration_ms, code)
    values (${a.userId}, ${a.exerciseId}, ${a.kind}, ${a.passed}, ${a.durationMs}, ${a.code})
  `;
}
```

Pravilo: `sql.unsafe(...)` se koristi **samo** u skripti za migracije, nikad sa podacima koji dolaze od korisnika.

### 4.4 Šema (prva migracija)

`db/migrations/001_init.sql`:

```sql
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  locale        text not null default 'sr' check (locale in ('sr', 'en')),
  created_at    timestamptz not null default now()
);

create table sessions (
  token_hash text primary key,              -- sha256 tokena; sam token je samo u cookie-ju
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_id_idx on sessions (user_id);

-- svaki Run i Submit; iz ovoga se računaju serija dana i statistika
create table attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references users(id) on delete cascade,
  exercise_id text not null,
  kind        text not null check (kind in ('run', 'submit')),
  passed      boolean not null,
  duration_ms integer,
  code        text not null,
  created_at  timestamptz not null default now()
);
create index attempts_user_exercise_idx on attempts (user_id, exercise_id, created_at desc);
create index attempts_user_created_idx on attempts (user_id, created_at);

-- jedno stanje po zadatku: status, beleške i SM-2 polja
create table exercise_progress (
  user_id       uuid not null references users(id) on delete cascade,
  exercise_id   text not null,
  status        text not null default 'in_progress'
                check (status in ('in_progress', 'solved', 'solved_with_help')),
  solved_at     timestamptz,
  best_time_ms  integer,
  hint_level    smallint not null default 0 check (hint_level between 0 and 3),
  notes         text,
  -- SM-2
  repetitions   integer not null default 0,
  ease_factor   numeric(4,2) not null default 2.50,
  interval_days integer not null default 0,
  due_at        timestamptz,
  last_grade    text check (last_grade in ('lako', 'dobro', 'tesko', 'nisam_znao')),
  updated_at    timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
create index exercise_progress_due_idx on exercise_progress (user_id, due_at);

-- svaki AI poziv; dnevni limit = count(*) za danas
create table ai_usage (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references users(id) on delete cascade,
  endpoint      text not null check (endpoint in ('hint', 'review', 'grade')),
  provider      text not null,
  model         text not null,
  input_tokens  integer,
  output_tokens integer,
  created_at    timestamptz not null default now()
);
create index ai_usage_user_created_idx on ai_usage (user_id, created_at);

-- isti kod za isti zadatak ne plaća se dvaput
create table ai_review_cache (
  user_id     uuid not null references users(id) on delete cascade,
  exercise_id text not null,
  code_hash   text not null,
  lang        text not null check (lang in ('sr', 'en')),
  response    jsonb not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, exercise_id, code_hash, lang)
);

-- Supabase automatski izlaže public šemu preko Data API-ja.
-- RLS bez ijedne polise blokira taj pristup; naša konekcija (vlasnik tabela) ga zaobilazi.
alter table users             enable row level security;
alter table sessions          enable row level security;
alter table attempts          enable row level security;
alter table exercise_progress enable row level security;
alter table ai_usage          enable row level security;
alter table ai_review_cache   enable row level security;
```

### 4.5 Migracije

- Fajlovi: `db/migrations/001_init.sql`, `002_...sql`. Jednom primenjen fajl se **ne menja**; ispravka ide u novu migraciju.
- Nema "down" migracija; greška se ispravlja novom migracijom.
- Migracije moraju biti kompatibilne unazad (prvo dodaj kolonu, pa kod koji je koristi; brisanje kolone tek u nekom kasnijem deploy-u), jer se pokreću ručno pre deploy-a.

`scripts/migrate.ts`:

```ts
import postgres from "postgres";
import { readdir, readFile } from "node:fs/promises";

const sql = postgres(process.env.DATABASE_URL_MIGRATIONS!, { max: 1 });

await sql`
  create table if not exists schema_migrations (
    name       text primary key,
    applied_at timestamptz not null default now()
  )
`;

const applied = new Set((await sql`select name from schema_migrations`).map((r) => r.name));
const files = (await readdir("db/migrations")).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const body = await readFile(`db/migrations/${file}`, "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`insert into schema_migrations (name) values (${file})`;
  });
  console.log(`✓ ${file}`);
}

await sql.end();
```

npm skripte:

```json
{
  "db:migrate": "tsx --env-file=.env.local scripts/migrate.ts",
  "db:migrate:prod": "tsx --env-file=.env.production.local scripts/migrate.ts",
  "user:create": "tsx --env-file=.env.local scripts/create-user.ts"
}
```

`.env.local` i `.env.production.local` su u `.gitignore` (Next.js ih podrazumevano ignoriše).

---

## 5. Etapa 2: prijava

Jedan korisnik, ali kroz pravi mehanizam, da se Faza 7 (više korisnika) svede na otvaranje registracije.

- **Lozinka:** `crypto.scrypt` iz Node-a, nasumična so, format u bazi `scrypt$<so>$<heš>`; poređenje preko `crypto.timingSafeEqual`.
- **Sesija:** posle prijave nasumičan token od 32 bajta; u bazu ide samo njegov SHA-256, a sam token u cookie `ks_session` (`httpOnly`, `secure` u produkciji, `sameSite=lax`, 30 dana).
- **Provera:** helper `requireUser()` u `lib/auth/session.ts` čita cookie, traži sesiju u bazi i vraća korisnika ili 401. Poziva se u svakom zaštićenom route handleru i u layout-u zaštićenih stranica.
- **Registracija:** isključena (`ALLOW_REGISTRATION=false`). Prvi korisnik se pravi skriptom `npm run user:create -- moj@email.com`, koja lozinku čita iz terminala.
- **Odjava:** briše red iz `sessions` i cookie.
- **Zaštita od CSRF-a:** `sameSite=lax` + provera `Origin` headera u route handlerima koji menjaju podatke.
- `lib/auth/password.ts` ne uvozi `server-only`, da bi ga skripta `create-user.ts` mogla koristiti.

---

## 6. Struktura projekta

Proširenje strukture iz sekcije 10 prvog plana. Oznaka **[E2]** znači da se fajl pravi tek u Etapi 2.

```
kata-stack/
├── app/
│   ├── [lang]/                           # sr | en
│   │   ├── layout.tsx                    # <html lang>, rečnik, prebacivač jezika
│   │   ├── (auth)/login/page.tsx         [E2]
│   │   └── (app)/                        # u E2 layout poziva requireUser()
│   │       ├── layout.tsx
│   │       ├── page.tsx                  # početna
│   │       ├── exercise/[id]/page.tsx
│   │       ├── tracks/[slug]/page.tsx
│   │       └── settings/page.tsx         # izvoz / uvoz JSON-a
│   └── api/                              # API nije pod [lang]
│       ├── health/route.ts               # E1: { ok: true }; E2: + select 1
│       ├── auth/login/route.ts           [E2]
│       ├── auth/logout/route.ts          [E2]
│       ├── progress/route.ts             [E2] stanje svih zadataka
│       ├── progress/[id]/route.ts        [E2] jedan zadatak: beleške, ocena težine
│       ├── progress/import/route.ts      [E2] uvoz JSON-a iz Etape 1
│       ├── attempts/route.ts             [E2] Run / Submit rezultat
│       ├── mentor/route.ts               [E2, posle prijave]
│       └── review/route.ts               [E2, posle prijave]
├── components/                           # kao u prvom planu
├── lib/
│   ├── storage/
│   │   ├── ProgressStore.ts              # interfejs
│   │   ├── localStorageStore.ts          # Etapa 1
│   │   ├── apiProgressStore.ts           [E2] implementacija preko fetch /api/progress
│   │   ├── exportImport.ts               # ProgressExport + Zod šema
│   │   └── index.ts                      # bira implementaciju (jedna linija)
│   ├── db/                               [E2]
│   │   ├── client.ts
│   │   └── queries/
│   │       ├── users.ts
│   │       ├── sessions.ts
│   │       ├── progress.ts
│   │       ├── attempts.ts
│   │       └── ai.ts                     # ai_usage, ai_review_cache
│   ├── auth/                             [E2]
│   │   ├── password.ts
│   │   └── session.ts                    # createSession, requireUser, destroySession
│   ├── runner/                           # kao u prvom planu
│   ├── ai/                               [E2] kao u prvom planu
│   ├── srs.ts
│   ├── content.ts
│   └── env.ts                            # Zod provera env varijabli pri pokretanju
├── db/migrations/001_init.sql            [E2]
├── scripts/                              [E2]
│   ├── migrate.ts
│   └── create-user.ts
├── content/                              # kao u prvom planu, ali sa { sr, en } poljima
├── i18n/
│   ├── config.ts                         # jezici, podrazumevani jezik
│   ├── localized.ts                      # LocalizedString + izbor jezika
│   └── dictionaries/{sr,en}.json
├── proxy.ts                              # / → /sr ili /en (cookie ks_lang → Accept-Language → sr)
├── types/
│   ├── exercise.ts
│   └── progress.ts                       # sekcija 3.1
├── docs/                                 # ovi planovi
├── .env.example                          # spisak varijabli bez vrednosti
├── .nvmrc                                # verzija Node-a (Netlify je čita)
└── netlify.toml                          # opciono, verovatno nije potreban
```

### Env varijable

U Etapi 1 nijedna nije potrebna. U Etapi 2:

| Varijabla | Lokalno | Netlify |
|---|---|---|
| `DATABASE_URL` | lokalni Postgres | Supabase transaction pooler (6543) |
| `DATABASE_URL_MIGRATIONS` | lokalni Postgres | ne treba (migracije idu sa mog računara) |
| `SESSION_COOKIE_NAME` | `ks_session` | `ks_session` |
| `ALLOW_REGISTRATION` | `false` | `false` |
| `AI_PROVIDER` | `deepseek` | `deepseek` |
| `OPENAI_API_KEY` | ključ | ključ |
| `DEEPSEEK_API_KEY` | ključ | ključ |
| `AI_DAILY_LIMIT` | `50` | `50` |

`lib/env.ts` ih proverava Zod-om, pa aplikacija odmah pada sa jasnom porukom ako nešto nedostaje, umesto čudne greške u produkciji.

---

## 7. Koraci izrade

Svaki korak ima uslov **"Gotovo kad"**: dok on nije ispunjen, ne prelazi se na sledeći.

### Deo A: Kostur (Faza 0)

#### Korak 1: Lokalno okruženje
- [ ] Node.js LTS (24 ili noviji), proveriti `node -v`
- [ ] GitHub repo `kata-stack` (privatan za sada)

**Gotovo kad:** `node -v` i `git --version` rade, a repo postoji na GitHub-u.

#### Korak 2: Next.js projekat
- [ ] `npx create-next-app@latest` sa TypeScript-om, Tailwind-om, ESLint-om, App Router-om i aliasom `@/*` (ako se buni zbog postojećih `.md` fajlova u folderu, privremeno ih izmesti, pa ih posle vrati u `docs/`)
- [ ] `.nvmrc` sa verzijom Node-a
- [ ] Prettier + `prettier-plugin-tailwindcss`
- [ ] Vitest za testove `lib/` koda
- [ ] `npm i zod`
- [ ] `app/api/health/route.ts` koji vraća `{ ok: true }`
- [ ] Prvi commit i push

**Gotovo kad:** `npm run dev` prikazuje početnu stranicu, a `npm run build` prolazi bez grešaka.

#### Korak 3: Netlify deploy
- [ ] Netlify → "Add new site" → povezati GitHub repo (Next.js se prepoznaje automatski)
- [ ] Prvi deploy
- [ ] Auto deploy na svaki push u `main`

**Gotovo kad:** `https://<sajt>.netlify.app/api/health` vraća `{ ok: true }`. Hosting je proveren prvog dana.

### Deo B: MVP sa localStorage-om (Faza 1, cilj: mogu da vežbam svaki dan)

#### Korak 4: Sadržaj
- [ ] `types/exercise.ts` i Zod šeme za `Exercise` i `Track` (sekcija 6 prvog plana)
- [ ] `lib/content.ts`: učitavanje svih JSON fajlova pri build-u, sa validacijom
- [ ] Build pada ako zadatak nije validan ili ako dva zadatka imaju isti `id`
- [ ] Prva 3 zadatka (JS početnik) za testiranje toka

**Gotovo kad:** stranica sa listom prikazuje 3 zadatka, a namerno pokvaren JSON obara `npm run build` sa jasnom porukom.

#### Korak 5: Runner i test biblioteka
- [ ] `lib/runner/types.ts`: ugovor `Runner` / `RunResult` (sekcija 4.3 prvog plana)
- [ ] Mini test biblioteka: `test`, `expect` (`toBe`, `toEqual`, `toThrow`, `resolves`)
- [ ] Adapter `worker` sa timeout-om i presretanjem `console.*`
- [ ] Adapter `worker-ts` (transpilacija preko sucrase ili esbuild-wasm)
- [ ] Adapter `types` (greške tipova iz Monaco TS servisa, `Expect`/`Equal`)
- [ ] Vitest testovi za test biblioteku i za timeout (`while(true){}` mora da se prekine)

**Gotovo kad:** beskonačna petlja ne zamrzava tab, a rezultat testova stiže u `RunResult` obliku.

#### Korak 5b: Dvojezičnost (sr/en)
Radi se odmah posle Koraka 5 i pre radnog ekrana, jer sve što sledi (UI, poruke, zadaci) ima tekst. Menja i ono što je već urađeno u koracima 4 i 5, a sada je to još jeftino.
- [ ] Pročitati i18n/routing vodiče u `node_modules/next/dist/docs/` (ova verzija Next.js-a ima izmene, npr. `proxy.ts` umesto `middleware.ts`)
- [ ] `i18n/config.ts`, `[lang]` segment, `generateStaticParams` za `sr` i `en`, `proxy.ts` sa redosledom: cookie `ks_lang` → `Accept-Language` → `sr`
- [ ] Rečnici `i18n/dictionaries/sr.json` i `en.json`, tipizovana funkcija `t()`; Vitest test pada ako jedan rečnik ima ključ koji drugi nema
- [ ] `LocalizedString = { sr, en }` kao Zod šema; polja `title`, `description`, `context`, `bugExplanation`, `solutions[].label/note` i naslov staze postaju lokalizovana; build pada ako fali jedan jezik
- [ ] Tagovi ostaju neutralni slug-ovi, a prikazani nazivi idu u rečnik
- [x] `test(name, fn)` prihvata string ili `{ sr, en }`; `TestResult.name` je isto (urađeno u Koraku 5, tip `TestName` u `lib/runner/types.ts`; u 5b ga zameniti zajedničkim `LocalizedString`)
- [x] Runner ne vraća rečenice: `error` je kod sa parametrima (`{ code: "timeout", ms }`), skriveni testovi nose `hiddenIndex`, a `expect` vraća `failure.code`, `matcher`, `expected` i `actual` (urađeno u Koraku 5)
- [ ] UI prevodi kodove iz runnera (`timeout`, `mismatch`, `negated`, `not-thrown`, `resolved-unexpectedly`, `rejected-unexpectedly`, `exception`, `transpile`, `worker`) iz rečnika
- [ ] Postojeća 3 zadatka i njihovi testovi dobijaju engleski tekst
- [ ] Prebacivač jezika (SR | EN) u zaglavlju; `<html lang>` iz segmenta
- [ ] Izvoz/uvoz JSON-a i napredak ostaju isti (ne zavise od jezika)

**Gotovo kad:** `/sr` i `/en` prikazuju istu listu zadataka, svaka na svom jeziku; prebacivač pamti izbor; zadatak kome fali engleski naslov obara `npm run build`.

#### Korak 6: Radni ekran
- [ ] `Workspace` sa tri kolone (`react-resizable-panels`) i fokus modom
- [ ] Monaco editor + Prettier + tipovi za `test`/`expect`
- [ ] `TopBar`: Run, Submit, Reset, Format, tajmer
- [ ] `TestResults`, `OutputConsole`
- [ ] Prečice Ctrl+Enter / Ctrl+Shift+Enter
- [ ] Svi tekstovi iz rečnika (bez ugrađenih stringova u komponentama); poruke runnera se prevode iz kodova
- [ ] Tema i raspored panela u `ks:ui`; nacrt koda se automatski čuva u `ks:v1:draft:<id>` na svakih par sekundi

**Gotovo kad:** mogu da rešim zadatak od početka do kraja, a posle osvežavanja stranice kod je i dalje tu.

#### Korak 7: Napredak u localStorage-u
- [ ] `types/progress.ts` i Zod šeme (sekcija 3.1)
- [ ] `ProgressStore` interfejs (async metode, iako je localStorage sinhron, da se Etapa 2 uklopi bez izmena u UI-u)
- [ ] `localStorageStore.ts` sa ključevima iz sekcije 3.2 i ograničenjem od 20 pokušaja po zadatku
- [ ] Submit koji prođe sve testove postavlja `status = 'solved'` i `solvedAt`
- [ ] Beleške (`NotesPanel`) u `notes`
- [ ] Stranica Podešavanja: izvoz i uvoz JSON-a (sekcija 3.3)
- [ ] Vitest testovi: izvoz → brisanje → uvoz daje iste podatke

**Gotovo kad:** rešim zadatak, izvezem JSON, obrišem podatke sajta u browseru, uvezem JSON i sve je kao pre.

#### Korak 8: Početni ekran i lista zadataka
- [ ] Oblasti × nivoi sa trakama napretka
- [ ] Lista zadataka sa filterom po tipu i tagu
- [ ] Oblasti bez gotovog okruženja prikazane kao "uskoro"
- [ ] **15 zadataka**: JavaScript, TypeScript i čista logika Node-a (svaki sa srpskim i engleskim tekstom; AI napravi nacrt drugog jezika, ja proverim)

**Gotovo kad:** svaki dan otvorim sajt i radim, bez ičega što me usporava. **MVP je gotov.**

#### Korak 9: Stvarno vežbanje (1–2 nedelje)
- [ ] Vežbam svaki dan na živom sajtu
- [ ] Beležim šta smeta (u GitHub issues ili u `docs/utisci.md`)
- [ ] Ispravljam samo ono što stvarno smeta vežbanju; nove funkcije čekaju
- [ ] Izvoz JSON-a jednom nedeljno

**Gotovo kad:** prošlo je bar 7 dana vežbanja i lista problema je ili prazna ili ispravljena.

### Deo C: Baza i prijava (Etapa 2)

#### Korak 10: Baza lokalno
- [ ] Lokalni PostgreSQL (instalacija za Windows ili Docker), baza `kata_stack`
- [ ] Alat za pregled baze: `psql` ili DBeaver / TablePlus
- [ ] `npm i postgres server-only` i `npm i -D tsx`
- [ ] `lib/env.ts` (Zod provera varijabli)
- [ ] `lib/db/client.ts` (sekcija 4.2)
- [ ] `db/migrations/001_init.sql` (sekcija 4.4)
- [ ] `scripts/migrate.ts` (sekcija 4.5) i npm skripta `db:migrate`
- [ ] `/api/health` dobija `select 1` i vraća `{ ok: true, db: "up" }`

**Gotovo kad:** `npm run db:migrate` napravi tabele (drugi put ne radi ništa), a `localhost:3000/api/health` vraća `db: "up"`.

#### Korak 11: Prijava
- [ ] `lib/auth/password.ts` (scrypt hash + verify)
- [ ] `lib/db/queries/users.ts` i `sessions.ts`
- [ ] `lib/auth/session.ts` (`createSession`, `requireUser`, `destroySession`)
- [ ] `scripts/create-user.ts` i napravljen moj korisnik
- [ ] `/api/auth/login`, `/api/auth/logout`, stranica `/login`
- [ ] Layout `(app)` preusmerava na `/login` ako sesija ne postoji
- [ ] Izbor jezika prijavljenog korisnika se čuva u `users.locale` (cookie `ks_lang` ostaje za neprijavljene); prijava vodi na `/{locale}`

**Gotovo kad:** bez prijave me vraća na `/login`; posle prijave vidim početnu; posle odjave cookie i red u `sessions` nestaju.

#### Korak 12: Napredak u bazi
- [ ] `lib/db/queries/progress.ts` i `attempts.ts`
- [ ] `/api/attempts`, `/api/progress`, `/api/progress/[id]`, sa Zod proverom tela i `requireUser()`
- [ ] `/api/progress/import`: prima `ProgressExport` iz Etape 1, upisuje ga u transakciji (`insert ... on conflict (user_id, exercise_id) do update`)
- [ ] `apiProgressStore.ts` i promena jedne linije u `lib/storage/index.ts`
- [ ] localStorage od sada čuva samo `ks:ui` i nacrte koda
- [ ] Izvoz JSON-a i dalje radi (sada čita iz baze), kao ručni backup

**Gotovo kad:** lokalno uvezem svoj JSON iz Etape 1 i vidim isti napredak kao pre, ali iz baze.

#### Korak 13: Supabase i produkcija
- [ ] Novi projekat na supabase.com, region **US East**, blizu podrazumevanog regiona Netlify funkcija (`us-east-2`), da upiti ne putuju preko okeana
- [ ] Jaka lozinka baze, sačuvana u password manager-u
- [ ] Iz "Connect" dijaloga kopirati transaction pooler (6543) i session pooler (5432) stringove
- [ ] Isključiti Data API u podešavanjima projekta (ne koristimo ga; RLS iz migracije je druga linija odbrane)
- [ ] `.env.production.local` sa `DATABASE_URL_MIGRATIONS` = session pooler
- [ ] `npm run db:migrate:prod` i `create-user` za produkcijsku bazu
- [ ] Na Netlify-ju dodati env varijable iz sekcije 6 (za sada bez AI ključeva), sa `DATABASE_URL` = transaction pooler
- [ ] Deploy preview-e (PR grane) ili isključiti ili podesiti posebnu bazu, da test grana ne piše u pravu bazu
- [ ] **Pre deploy-a:** poslednji izvoz JSON-a sa živog sajta
- [ ] Deploy, prijava na živom sajtu, uvoz JSON-a
- [ ] Posle uspešnog uvoza aplikacija sama briše `ks:v1:progress` i `ks:v1:attempts` iz browsera (ostaju samo `ks:ui` i nacrti koda); `localStorageStore.ts` se zatim briše iz koda

**Gotovo kad:** na živom sajtu je ceo napredak iz Etape 1, a posle rešavanja zadatka na laptopu isti napredak vidim i na drugom računaru.

### Deo D: Nadogradnje (faze 2–5 iz prvog plana)

#### Korak 14: AI mentor i review (Faza 2)
- [ ] `lib/ai/AiProvider.ts`, `openaiCompatible.ts` (jedna implementacija, dva podešavanja: OpenAI i DeepSeek)
- [ ] Zod šeme za JSON odgovore; ako odgovor ne prođe, jedan ponovni pokušaj, pa poruka o grešci
- [ ] `/api/mentor` sa 3 nivoa; `hint_level` u `exercise_progress` sprečava preskakanje nivoa
- [ ] `/api/review` posle uspešnog Submit-a, sa keširanjem u `ai_review_cache` (ključ: SHA-256 koda)
- [ ] Dnevni limit: pre poziva `select count(*) from ai_usage where user_id = $1 and created_at >= current_date`
- [ ] Oba endpointa počinju sa `requireUser()`
- [ ] Zahtev nosi `lang` (Zod: `sr` ili `en`); prompt traži odgovor na tom jeziku, a kod i identifikatori ostaju neprevedeni
- [ ] Ključ keša u `ai_review_cache` uključuje jezik (kolona `lang` je već u `001_init.sql`), da `en` review ne dobije `sr` odgovor
- [ ] Streamovanje odgovora (zbog vremenskog limita Netlify funkcija)
- [ ] Nivo 3 postavlja `status = 'solved_with_help'`
- [ ] Tek sada: AI ključevi u Netlify env varijable

**Gotovo kad:** mentor pomaže bez otkrivanja rešenja u nivoima 1 i 2, poziv bez prijave vraća 401, a 51. poziv u danu vraća poruku o limitu.

#### Korak 15: React i Next.js zadaci (Faza 3)
- [ ] Adapter `iframe-react` + `render` / `screen` / `userEvent`
- [ ] React zadaci za sva tri nivoa
- [ ] Next.js zadaci po delovima (route handleri, middleware, server actions) preko `worker-ts`

#### Korak 16: Vežbanje uz AI (Faza 4)
- [ ] `bug-hunt` + AI ocena objašnjenja (`ai_usage.endpoint = 'grade'`)
- [ ] `code-review`, `fix-the-prompt`, `code-reading`
- [ ] Rezultati AI ocene se čuvaju u novoj tabeli (migracija `00X_ai_grades.sql`)

#### Korak 17: Ponavljanje, staze i statistika (Faza 5)
- [ ] `lib/srs.ts` (SM-2) sa Vitest testovima: ista ocena mora uvek dati isti sledeći datum
- [ ] Ocena težine posle Submit-a ažurira SM-2 kolone u `exercise_progress`
- [ ] "Danas za ponavljanje" (`due_at <= now()`)
- [ ] Staze iz `content/tracks`
- [ ] Serija dana iz `attempts` (SQL sa `generate_series` ili `date_trunc` po danima)
- [ ] Jake i slabe teme po tagovima

### Deo E: Opciono

#### Korak 18: WebContainer (Faza 6)
- [ ] COOP/COEP headeri u `next.config` samo za rute koje ga koriste (proveriti da ne kvare Monaco i ostatak sajta)
- [ ] Adapter `webcontainer` i Node zadaci sa `fs`, `http`, streams

#### Korak 19: Više korisnika (Faza 7)
Pošto prijava i `user_id` u svim tabelama već postoje, ovo je uglavnom:
- [ ] Registracija (`ALLOW_REGISTRATION=true`), potvrda email-a, reset lozinke
- [ ] Ograničenje pokušaja prijave (nova tabela `login_attempts`)
- [ ] Server-side provera rešenja za skrivene testove
- [ ] AI limit po korisniku i po planu
- [ ] Brisanje starih redova iz `sessions` i `attempts` (zakazan posao ili čišćenje pri prijavi)
- [ ] Prelazak Supabase-a na plaćeni plan ako besplatni ne bude dovoljan

---

## 8. Deploy proces (svakodnevno)

**Etapa 1:** radim na grani → merge u `main` → Netlify automatski deploy-uje → provera jednog zadatka na živom sajtu.

**Etapa 2:**
1. Radim na grani, lokalno sa lokalnom bazom.
2. Ako postoji nova migracija: `npm run db:migrate` lokalno, provera.
3. Merge u `main`.
4. **Pre** nego što Netlify završi deploy: `npm run db:migrate:prod` (migracije su kompatibilne unazad, pa stari kod radi i sa novom šemom).
5. Netlify automatski deploy-uje `main`.
6. Provera: `/api/health` i jedan zadatak od početka do kraja.

Kasnije se koraci 4 i 6 mogu prebaciti u GitHub Action, ali ručno je sasvim dovoljno dok je korisnik jedan.

---

## 9. Bezbednosni minimum

Etapa 1:
- [ ] Nema API ključeva na Netlify-ju i nema AI endpointa
- [ ] Korisnički kod se izvršava samo u Worker-u / sandboxed iframe-u, nikad u glavnom prozoru
- [ ] Uvoz JSON-a prolazi kroz Zod pre upisa

Etapa 2 (dodatno):
- [ ] Nijedan ključ (baza, AI) nije u klijentskom kodu niti u `NEXT_PUBLIC_*` varijablama
- [ ] `server-only` uvezen u `lib/db/client.ts` i `lib/ai/*`, da build padne ako ih neko uveze u klijentsku komponentu
- [ ] Svi upiti preko tagged template-a; nigde spajanje stringova u SQL
- [ ] Zod na svakom telu zahteva i query parametru
- [ ] Svaki zaštićeni route handler počinje sa `requireUser()`
- [ ] RLS uključen na svim tabelama i Data API isključen na Supabase-u
- [ ] Cookie: `httpOnly`, `secure`, `sameSite=lax`

---

## 10. Rizici

| Rizik | Kako ga ublažiti |
|---|---|
| Gubitak napretka u Etapi 1 (brisanje podataka browsera) | Izvoz JSON-a jednom nedeljno |
| localStorage se napuni (~5 MB) | Samo poslednjih 20 pokušaja po zadatku |
| Oblik podataka u localStorage-u se ne poklapa sa bazom | Isti oblik od početka (sekcija 3.1), verzija `v1` u ključu |
| Etapa 1 se razvuče i baza nikad ne dođe | Etapa 2 je uslov za AI mentora, koji je jedan od glavnih razloga za projekat |
| Previše konekcija iz serverless funkcija | Transaction pooler (6543), `max: 1` po instanci |
| Greška "prepared statement already exists" | `prepare: false` u klijentu |
| Besplatan Supabase projekat se pauzira posle perioda neaktivnosti | Svakodnevno korišćenje ga drži aktivnim; proveriti trenutne uslove besplatnog plana |
| Spori upiti zbog udaljenosti Netlify ↔ Supabase | Isti region (US East) |
| Vremenski limit Netlify funkcija za AI pozive | Streamovanje odgovora; kratki promptovi |
| Migracija pokvari produkciju | Kompatibilnost unazad, test lokalno, Supabase dnevni backup |
| Vezivanje za Supabase | Koristimo samo Postgres; prelazak = nova `DATABASE_URL` + `db:migrate:prod` |
| Deploy preview piše u pravu bazu | Posebna baza ili isključeni preview-i (korak 13) |
| Prevođenje udvostručuje posao oko zadataka | AI pravi nacrt, ja proveravam; build pada ako fali jedan jezik, pa nepotpun zadatak ne može u produkciju |
| Srpski tekst ostane ugrađen u kod (runner, komponente) | Runner vraća kodove; test rečnika; od Koraka 5b nema stringova u komponentama |
| Keširan AI odgovor na pogrešnom jeziku | Jezik je deo ključa keša (korak 14) |
