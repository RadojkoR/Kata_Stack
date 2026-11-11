# Pravila za opis zadatka

> Važi za polje `description` (tekst zadatka), ne za rešenja i `walkthrough`.
> Pisano za nivo **početnik**; razlike za srednji i expert su u sekciji 7.
> Koristi se kao uputstvo za pisanje novih zadataka i za pregled postojećih.

## 1. Cilj

Početnik posle čitanja opisa treba da zna četiri stvari, bez gledanja testova:

1. šta funkcija prima,
2. šta vraća,
3. šta se dešava u posebnim slučajevima,
4. koji pojam ovde vežba.

Opis objašnjava **šta** se traži i **zašto je tako**, nikad **kako** se rešava.

## 2. Struktura opisa

Uvek ovim redom. Delovi označeni sa (po potrebi) se izostavljaju ako nemaju šta da kažu.

1. **Pojam** (po potrebi): 1–3 rečenice koje objašnjavaju nov pojam, pre samog zadatka.
2. **Zadatak**: jedna rečenica: "Napiši funkciju `ime(parametri)` koja ...".
3. **Ulaz i izlaz**: šta je svaki parametar i šta se vraća, sa tipom rečima ("niz brojeva", "tekst", "`true` ili `false`").
4. **Pravila**: lista posebnih slučajeva, jedno pravilo po stavci.
5. **Primeri**: 3–5 primera, od najjednostavnijeg ka posebnim slučajevima.
6. **Napomena** (po potrebi): ograničenje ("ne menjaj ulazni niz") ili česta zabuna.

## 3. Pravila

### 3.1 Nov pojam se objašnjava pre zadatka
Ako zadatak prvi put koristi pojam (truthy/falsy, closure, strogo poređenje, `NaN`, mutacija, rest parametri), opis počinje objašnjenjem tog pojma običnim rečima i jednim malim primerom. Uzor: `count-truthy-01`.

Pojam koji je već uveden u ranijem zadatku istog nivoa ne objašnjava se ponovo; dovoljna je jedna rečenica podsetnika.

### 3.2 Svako pravilo ima primer
Sve što skriveni testovi proveravaju mora da piše u opisu **i** da ima primer. Početnik ne sme da padne na nečemu što nije video.

- Ako pravilo kaže "velika i mala slova se ignorišu", postoji primer sa velikim slovima.
- Ako skriveni test proverava `'0'`, `[]` ili negativne brojeve, bar jedan takav slučaj je u primerima.
- Izuzetak: "ne menja ulazni niz" se navodi kao napomena, bez primera.

### 3.3 Primeri idu od lakog ka teškom
1. običan slučaj koji pokazuje osnovnu ideju,
2. još jedan običan slučaj sa drugačijim ulazom,
3. granični slučajevi: prazan ulaz, jedan element, nula, negativni brojevi,
4. slučajevi koji iznenade (npr. `'1'` nije isto što i `1`).

Uz primer koji iznenadi ide kratko "zato što": `unique([1, '1'])` → `[1, '1']`, jer su broj i tekst različite vrednosti.

### 3.4 Običan jezik
- Kratke rečenice. Jedna misao po rečenici.
- Stručan izraz se pri prvom pominjanju prevede: "strogo poređenje (`===`), koje ne pretvara tipove".
- Bez poređenja sa metodama koje početnik možda ne zna ("kao `indexOf`", "za razliku od `includes`"). Ako je poređenje bitno, objasni ponašanje, ne ime metode.
- Engleski izraz ostaje kad je uobičajen (closure, truthy), uz srpsko objašnjenje.

### 3.5 Tipovi rečima
Početnik ne čita potpis funkcije kao dokumentaciju. Napiši: "`items` je niz bilo kakvih vrednosti, `count` je ceo broj, 0 ili veći. Funkcija vraća novi niz."

### 3.6 Opis ne otkriva rešenje
- Ne imenuj metodu kojom se rešava ("upotrebi `filter`"), osim kad je baš ta metoda tema zadatka.
- Ne opisuj korake algoritma.
- Dozvoljeno je reći šta se vežba: "Ovde vežbaš prolazak kroz niz petljom."

### 3.7 Ograničenja su poštena
- Ograničenje koje testovi proveravaju piše se kao pravilo: "Originalni niz se ne menja."
- Ograničenje koje testovi ne proveravaju piše se kao preporuka i to se kaže otvoreno: "Preporuka: reši bez `Math.max`. Testovi proveravaju samo rezultat."

### 3.8 Dužina
- Početnik: 80–180 reči po jeziku. Duže samo kad se uvodi nov pojam.
- Detaljnije ne znači duže: prvo dodaj primer, pa tek onda rečenicu.

### 3.9 Formatiranje
Prikaz opisa podržava samo: pasuse, liste sa `- `, `kod` u liniji i blokove koda sa tri obrnuta apostrofa. **Nema** naslova, podebljanog teksta ni tabela.

- Nazivi delova se pišu kao običan red sa dvotačkom: `Primeri:`, `Pravila:`.
- Primer u jednoj liniji: `ime(ulaz)` → `izlaz`.
- Primer u više koraka (stanje, više poziva) ide u blok koda sa komentarima.
- Imena funkcija, parametara i vrednosti su uvek u `kodu`.

### 3.10 Oba jezika
- `sr` i `en` imaju iste delove, ista pravila i iste primere, istim redom.
- Srpski latinicom. Prevod po smislu, ne reč po reč.

## 4. Šablon

```
[Pojam: 1–3 rečenice i mali primer, samo ako je pojam nov.]

Napiši funkciju `ime(a, b)` koja [šta radi, jednom rečenicom].

`a` je [tip rečima], `b` je [tip rečima]. Funkcija vraća [tip rečima].

Pravila:
- [poseban slučaj 1]
- [poseban slučaj 2]

Primeri:
- `ime(...)` → `...`
- `ime(...)` → `...`
- `ime(...)` → `...`, jer [zašto, ako iznenađuje]

[Napomena ili preporuka, ako postoji.]
```

## 5. Primer: pre i posle (`closure-counter-01`)

Pre:

```
Napiši funkciju `createCounter(start = 0)` koja vraća funkciju. Svaki poziv
vraćene funkcije povećava brojač za 1 i vraća novu vrednost.

Svaki brojač ima svoje stanje, bez globalnih promenljivih.
```

Problemi: pojam closure nije objašnjen (3.1), početna vrednost i nezavisni brojači nemaju primer (3.2), "vraća funkciju" je apstraktno (3.4).

Posle:

```
Funkcija može da napravi i vrati drugu funkciju. Vraćena funkcija „pamti“
promenljive iz funkcije koja ju je napravila, čak i kad se ta funkcija
završi. To pamćenje se zove closure.

Napiši funkciju `createCounter(start)` koja pravi brojač.

`start` je broj od kog brojač kreće; ako se ne navede, kreće od 0.
`createCounter` vraća funkciju. Svaki poziv te funkcije povećava brojač
za 1 i vraća novu vrednost.

Pravila:
- prvi poziv vraća `start + 1`
- svaki brojač ima svoje stanje i ne utiče na druge brojače

Primeri:
(blok koda)
const c = createCounter();
c(); // 1
c(); // 2

const d = createCounter(10);
d(); // 11

const a = createCounter();
const b = createCounter();
a(); // 1
a(); // 2
b(); // 1, jer b broji odvojeno od a
(kraj bloka)

Preporuka: stanje čuvaj unutar `createCounter`, ne u globalnoj promenljivoj.
```

Opis i dalje ne kaže kako se closure piše; kaže samo šta je i šta funkcija treba da radi.

## 6. Lista za proveru

Pre nego što je zadatak gotov:

- [ ] Nov pojam je objašnjen pre zadatka, običnim rečima.
- [ ] Piše šta je svaki parametar i šta se vraća.
- [ ] Svaki skriveni test ima svoje pravilo i svoj primer u opisu.
- [ ] Primeri idu od običnog ka graničnom slučaju.
- [ ] Primer koji iznenađuje ima "jer ...".
- [ ] Nema imena metode kojom se zadatak rešava ni koraka rešenja.
- [ ] Ograničenja koja testovi ne proveravaju označena su kao preporuka.
- [ ] Korišćeni su samo pasusi, liste, `kod` i blokovi koda.
- [ ] `sr` i `en` imaju iste delove i iste primere.
- [ ] Opis je pročitan kao da ga čita neko ko je juče naučio šta je niz.

## 7. Srednji i expert

- **Srednji:** osnovni pojmovi se ne objašnjavaju; objašnjava se samo ono što je novo za taj nivo (npr. šta `debounce` treba da radi). Pravila 3.2 i 3.7 važe u potpunosti. Tipovi mogu u potpisu umesto rečima.
- **Expert:** opis može biti kratak kao specifikacija. Ne mora svaki skriveni test da ima primer, ali svako pravilo mora da piše u opisu. Deo vežbe je da sam nađeš granične slučajeve.

## 8. Redosled zadataka

Opis podrazumeva šta je korisnik već video, pa unutar nivoa zadaci treba da idu od lakšeg ka težem, a ne po abecedi. Zadatak koji uvodi pojam ide pre zadataka koji taj pojam koriste. (Trenutno je redosled po imenu fajla; ovo traži posebno polje ili listu redosleda.)
