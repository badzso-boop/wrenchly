# Home Expenses and Cookings at Home — tervezési dokumentum

Ez a dokumentum **tervet** ír le, implementáció (kód) még nincs mögötte — a cél, hogy
mielőtt bármit építünk, legyen egy közösen átnézett, feladatokra bontott terv. A tényleges
fejlesztés egy vagy több külön PR-ben fog történni, erre a tervre hivatkozva.

## Miért kell ez

Norbi szeretné tudni vezetni az otthoni kiadásokat/bevételeket (bevásárlás, kaja rendelés,
otthonra vett dolgok — minden, ami a lakást/megélhetést érinti), ugyanolyan naplózó
logikával, mint ahogy a projekt ma is vezeti egy jármű karbantartás/tankolás-történetét.
Emellett szeretne egy főzés-naplót is (mit főztek, milyen alapanyagokkal, mekkora adagot,
hány napra elég, mennyibe került), a kiadásokéhoz hasonló, kereshető/statisztikázható
formában, plusz egy egyszerű kedvenc-kaják listát.

## A már eldöntött kérdések

Három nyitott kérdést tisztáztunk előzetesen:

1. **Adatmodell-illeszkedés**: **teljesen új `HOME` `ItemType`** jön létre, nem a meglévő
   `PROPERTY` típus bővül. Ez azt jelenti, hogy Norbi létre tud hozni egy "Otthon" nevű
   elemet (`Item.type = HOME`), aminek lesz saját (minimális) profilja, és ez alá kerülnek a
   kiadás/bevétel napló, a főzés-napló és a kedvenc kaják lista tabjai — függetlenül attól,
   hogy van-e a felhasználónak egy PROPERTY-típusú "fizikai ingatlan" eleme is.
2. **Kaja-név egyeztetés (fuzzy matching)**: **csak beküldéskori figyelmeztetés**, élő
   autocomplete nélkül — amikor egy új főzés-napló bejegyzést mentesz, a backend
   hasonlóság-keresést futtat a már meglévő kaja-nevek között (ugyanahhoz a Home elemhez), és
   ha talál egy közeli egyezést, egy "Ez már létezik: X — ezt szeretted volna, vagy tényleg új
   nevet adsz?" választ ad vissza, amit a frontend megerősítő dialógusként jelenít meg. A user
   felülbírálhatja (tényleg új nevet akar).
3. **Kiadás-kategóriák**: **fix kategórialista**, a meglévő karbantartás-kategória minta
   szerint (lásd `maintenance.categories.ts` — `Record<ItemType, {value,label}[]>`, szabad
   string érték, nem DB enum, tehát bővíthető migráció nélkül). Kezdő lista:
   `GROCERY` (Bevásárlás), `FOOD_DELIVERY` (Étel rendelés), `HOUSEHOLD_ITEM` (Otthoni eszköz),
   `UTILITIES` (Rezsi — ezt én javasoltam hozzá, nagyon gyakori otthoni kiadás), `OTHER` (Egyéb).

## Adatmodell terv (Prisma)

### Új `ItemType` érték: `HOME`

Ez egy **kimerítő (exhaustive) enum**, tehát minden helyen, ahol ma `Record<ItemType, X>`
típusú leképezés van a kódban, kötelezően bővíteni kell egy `HOME` ággal, különben a
TypeScript build elbukik. Ez jelenleg **6 fájlt** érint (ellenőrizve a jelen tervezéskor):

- `server/domains/profile/profile.fields.ts` (a generikus "Profil" tab mezői)
- `server/domains/reading/reading.fields.ts`
- `server/domains/maintenance/maintenance.categories.ts`
- `components/domains/statistics/ReadingStatisticsClient.tsx`
- `components/domains/item/NewItemClient.tsx` (típus-specifikus form mezők + placeholder)
- `components/domains/item/item-log-config.ts`

### `HomeProfile` (minimális, a `PropertyProfile`/`AquariumProfile` mintájára)

```prisma
model HomeProfile {
  itemId        String  @id
  householdSize Int?    // hányan élnek ott — később hasznos lehet fejenkénti stathoz
  notes         String?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("home_profiles")
}
```

Tudatosan minimális — a "Home" elem lényege nem a fizikai attribútumok (azok a PROPERTY
típusnál már léteznek), hanem a rajta vezetett napló-adatok.

### `HouseholdTransaction` (kiadás ÉS bevétel egy táblában)

Egy tervezési döntés, amit **nem kérdeztem meg külön, de itt indoklom**: a kiadást és a
bevételt egyetlen táblában, egy `type` diszkriminátorral modellezem szét-modellezés helyett —
ez azért jobb, mert a kért statisztikák (havi mérleg, összes átlagos költés, ki mennyit fizet
be) mindkét irányt együtt kell összegezzék/csoportosítsák, és egy közös táblán ez egyetlen
`GROUP BY` kérdés, nem kettő, amit utólag kellene összefésülni.

```prisma
enum HouseholdTransactionType {
  EXPENSE
  INCOME
}

model HouseholdTransaction {
  id          String                    @id @default(cuid())
  itemId      String
  userId      String
  type        HouseholdTransactionType
  amount      Decimal                   @db.Decimal(10, 2)
  currency    String                    @default("HUF")
  category    String?                   // csak EXPENSE-nél értelmezett, fix lista (lásd fent)
  paidBy      String                    // "Norbi" / "Dori" — egyelőre hardcode dropdown, l. lent
  store       String?                   // bolt/hely, ahol a kiadás történt (pl. "Lidl", "Wolt")
  description String?
  occurredAt  DateTime
  createdAt   DateTime                  @default(now())
  updatedAt   DateTime                  @updatedAt

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([itemId, occurredAt])
  @@index([itemId, type])
  @@map("household_transactions")
}
```

**"Ki" mező**: a kérésnek megfelelően most egy egyszerű dropdown/string, `"Norbi"` és
`"Dori"` hardcode-olt opciókkal a frontend oldalon (nem külön DB-tábla, nem `User`
foreign key — mert nem biztos, hogy mindkét névnek van/lesz saját wrenchly-fiókja). Ha ez
egyszer bővülne (több névre, vagy tényleges user-referenciára), a `paidBy` mező free-text
String marad, csak a frontend dropdown listája bővül — nem kell migráció.

**"Bolt/hely" mező** (`store`): opcionális szabad szöveg (nem dropdown/lista MVP-ben, pl.
"Lidl", "Wolt", "Auchan") — a `TripFuelStop.station` mezőjének mintájára. Egyelőre nincs
hozzá saját statisztika a tervben (pl. "melyik boltban költünk a legtöbbet"), de mivel a mező
maga olcsó hozzáadni, és később bármikor rá lehet építeni egy ilyen bontást is, érdemes most
felvenni, hogy a régi rekordok is tudják kitölteni.

### `CookingLogEntry`

```prisma
model CookingLogEntry {
  id                 String    @id @default(cuid())
  itemId             String
  userId             String
  name               String    // a kaja neve — ide fut a fuzzy-match beküldéskor
  ingredients         String?   // szabad szöveges alapanyag-lista (MVP: nem strukturált)
  servings            Int?      // "mekkora adagot" — hány adagra készült
  daysCovered         Int?      // "hány napra elegendő"
  cost                Decimal?  @db.Decimal(10, 2)
  currency             String    @default("HUF")
  linkedTransactionId String?   // opcionális kapcsolat a bevásárlást fedő kiadáshoz
  cookedAt             DateTime
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  item              Item                  @relation(fields: [itemId], references: [id], onDelete: Cascade)
  user              User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  linkedTransaction HouseholdTransaction? @relation(fields: [linkedTransactionId], references: [id], onDelete: SetNull)

  @@index([itemId, cookedAt])
  @@index([itemId, name])
  @@map("cooking_log_entries")
}
```

`ingredients` MVP-ben szabad szöveg (nem strukturált tétel-lista) — a kérés nem igényelt
alapanyag-szintű statisztikát, csak kaja-szintűt, úgyhogy ez a legkisebb, még mindig hasznos
megoldás. Ha valaha kell alapanyag-szintű bontás is, ez egy külön, rátehető réteg lehet, nem
kell most beépíteni.

**Bevásárlólista-integráció** (jóváhagyott kiegészítés): a wrenchly-ban már létezik egy
`ShoppingListItem` modell (felhasználói szintű bevásárlólista, `PENDING`/`BOUGHT`/`CANCELLED`
állapottal, opcionális `itemId` mezővel, amivel ma is köthető egy adott `Item`-hez). Ezt
bővítjük egy új, opcionális `cookingLogEntryId` mezővel:

```prisma
model ShoppingListItem {
  // ...meglévő mezők változatlanul...
  cookingLogEntryId String?

  cookingLogEntry CookingLogEntry? @relation(fields: [cookingLogEntryId], references: [id], onDelete: SetNull)
}
```

Ezzel két irányban lehet használni, mindkettő **kézi, nem automatikus** párosítás (mivel az
`ingredients` mező szabad szöveg, nincs mihez automatikusan illeszteni egy inventory-tételt):

1. **Bevásárlástól a főzésig**: a bevásárlólistán meglévő (vagy `BOUGHT` státuszúra állított)
   tételeket hozzá lehet rendelni egy `CookingLogEntry`-hez, jelezve, hogy "ezekből főztem" —
   ez adja meg a kért "egymásra hivatkozás" lehetőséget a bevásárlás és a főzés között,
   finomabb szemcsézettséggel, mint a `linkedTransactionId` (ami egy teljes kiadás-rekordot
   köt össze, nem egyedi tételeket).
2. **Főzéstől a bevásárlásig**: egy Főzés napló bejegyzésből (vagy egy Kedvenc kajából) egy
   "Bevásárlólistára" gyorsgomb új `ShoppingListItem` sorokat hoz létre, `cookingLogEntryId`-vel
   megjelölve — a user kézzel írja be a hiányzó alapanyagokat (nincs automatikus
   ingredient-parsing/matching az `InventoryItem` készlethez, mert az MVP `ingredients` mezője
   nem strukturált; ez egy tudatos, jövőre hagyott mélyebb integráció lenne).

Az `InventoryItem` (raktárkészlet) automatikus fogyás-követése (pl. "ezt a főzést levontuk a
készletből") **szándékosan nincs ebben a körben** — ahhoz strukturált, mennyiséggel ellátott
alapanyag-lista kellene, ami ellentmondana a fenti, tudatosan szabad-szöveges MVP-döntésnek.

### `FavoriteMeal`

```prisma
model FavoriteMeal {
  id        String   @id @default(cuid())
  itemId    String
  userId    String
  name      String
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@map("favorite_meals")
}
```

Egyszerű lista, szabványos CRUD (hozzáadás/szerkesztés/törlés) — ahogy kérted. **Extra ötlet**
(nem kötelező, ha nem kell hagyjuk ki): egy kedvenc kajára kattintva egy "Ezt főztem ma"
gyorsgomb előtöltve nyitja meg a főzés-napló form-ot a névvel — hasznos lehet a "nem tudom mit
főzzek" use case-hez, amit említettél.

## Fuzzy-matching a kaja-neveknél — technikai megközelítés

Mivel Postgres-t használunk, a legegyszerűbb, új npm-függőség nélküli megoldás a `pg_trgm`
Postgres extension (`similarity()` függvény / `%` operátor, trigram-alapú szöveg-hasonlóság)
— ez server-side, gyors, és nem igényel új csomagot a projektbe (ami eddig is preferált minta
volt, lásd a statisztika-chartok saját SVG-s, függőség nélküli megoldását). Alternatíva:
egy kis JS Levenshtein-implementáció a service rétegben, ha a `pg_trgm` extension
engedélyezése (egy egyszeri `CREATE EXTENSION` migráció) valamiért nem kívánatos. **Ezt a
konkrét választást implementáció közben kell eldönteni** (nyitva hagyva a tervben), miután
megnéztük, hogy a `pg_trgm` engedélyezhető-e gond nélkül az éles Postgres konténeren.

A beküldés folyamata:
1. User beküldi az új kaja nevét.
2. Backend lekérdezi az adott Home elemhez tartozó eddigi distinct kaja-neveket, és
   hasonlóságot számol az újjal.
3. Ha van egy adott küszöb feletti találat, **nem menti el automatikusan**, hanem egy
   "lehetséges duplikátum" választ ad vissza a legjobb találattal (hasonlóan ahhoz, ahogy a
   legymernok projekt `ResourceConflictException`-je extra `data` mezőt ad a válaszhoz
   ütközésnél) — a frontend ez alapján mutat egy megerősítő dialógust.
4. User vagy rákattint a javasolt névre (ezt menti), vagy megerősíti, hogy tényleg új nevet
   akar (egy `forceNew: true` flag-gel újraküldi, ezúttal a backend a fuzzy-checket kihagyja).

## Frontend terv

Az "Otthon" (`HOME`) item ugyanúgy az `Item` lista része, mint bármelyik más típus — Norbi a
meglévő "Új elem" flow-ból hozza létre, `type: HOME`-mal. Az item-detail oldalon az alábbi
tabok jelennek meg (a `VEHICLE` item mai Karbantartás / Vehicle Profile / Trip Log /
Statisztika tab-mintájának megfelelően):

- **Otthon Profil** — a minimális `HomeProfile` mezők (`householdSize`, `notes`).
- **Kiadások és Bevételek** — lista + form a `HouseholdTransaction` rekordokhoz, típus
  (kiadás/bevétel) váltóval, kategória-dropdown (csak kiadásnál), "Ki" dropdown (Norbi/Dori),
  bolt/hely mező (csak kiadásnál), összeg, dátum, megjegyzés.
- **Főzés napló** — lista + form a `CookingLogEntry`-khez, a fuzzy-match megerősítő
  dialógussal, opcionális kapcsolattal egy kiadáshoz (dropdown a Home elem GROCERY-kategóriájú
  kiadásaiból), és opcionális bevásárlólista-tétel(ek) hozzárendelésével ("ezekből főztem" —
  lásd az adatmodell résznél), plusz egy "Bevásárlólistára" gyorsgomb, ami hiányzó
  alapanyagokat vesz fel új `ShoppingListItem`-ként.
- **Kedvenc kajék** — egyszerű CRUD lista.
- **Statisztika** — lásd lent.

## Statisztika terv

A meglévő `TripStatisticsClient` (korábban `VehicleStatisticsClient`, nemrég általánosítva
más típusokra is) mintáját követve, saját, függőség nélküli SVG chartokkal:

- **Havi kiadás-összesítő** (oszlopdiagram, hónapról hónapra, mint a
  `ConsumptionTrendChart`).
- **Összes/átlagos havi költés** (stat tile, "all-time" és "utolsó 30 nap" bontásban, mint a
  jármű-statisztikáknál).
- **Ki mennyit fizetett be** — `paidBy` szerinti bontás (kiadás ÉS bevétel oldalon is
  értelmes lehet: ki fizetett a boltban vs. ki tette be a közösbe).
- **Kategória-bontás** — kiadások kategóriák szerint (kördiagram vagy oszlop).
- **Havi mérleg** (bevétel − kiadás), ha van bevétel-adat az adott hónapra.
- **Kaja-gyakoriság** — egy adott hónapban (vagy összesen) melyik kaját hányszor főzték,
  csökkenő sorrendben, top N oszlopdiagramként — ez a fuzzy-matchinggel együtt működik
  értelmesen (enélkül a "Carbonara" és "Carbonarát" külön sorként rontaná a listát).

## Feladatlista

### 1. Backend — adatmodell és migráció
- [ ] `ItemType` enum bővítése `HOME`-mal
- [ ] `HomeProfile`, `HouseholdTransaction` (+ `HouseholdTransactionType` enum),
      `CookingLogEntry`, `FavoriteMeal` Prisma modellek
- [ ] Flyway-hez hasonlóan itt Prisma migráció (a projekt már meglévő
      `docker run node:22-slim`-es trükkjével, a host `pnpm` limitáció miatt)
- [ ] Döntés + implementáció: `pg_trgm` extension engedélyezése vs. JS-alapú
      hasonlóság-számítás a fuzzy-matchhez

### 2. Backend — Kiadás/Bevétel domain (`server/domains/household-finance/` vagy hasonló)
- [ ] repository/service/handler réteg, a `trip` domain mintájára
- [ ] CRUD végpontok (`create`, `update`, `delete`, `listByItemId`)
- [ ] kategória-regisztry (`household-finance.categories.ts`, a
      `maintenance.categories.ts` mintájára, de nem `Record<ItemType,...>`, mert ez csak
      HOME-ra értelmezett)
- [ ] unit tesztek

### 3. Backend — Főzés napló domain (`server/domains/cooking/` vagy hasonló)
- [ ] repository/service/handler réteg
- [ ] CRUD végpontok + a fuzzy-match ellenőrzés a `create`-ben (`forceNew` flag-gel
      megkerülhető)
- [ ] opcionális kapcsolat egy `HouseholdTransaction`-höz
- [ ] `ShoppingListItem.cookingLogEntryId` kezelése: tételek hozzárendelése egy meglévő
      `CookingLogEntry`-hez, és egy "hozz létre bevásárlólista-tételeket ehhez a
      recepthez" végpont (a `shopping-list`/`inventory` domain meglévő
      create-mutation-jét hívja, csak `cookingLogEntryId`-vel kiegészítve)
- [ ] unit tesztek (kifejezetten a fuzzy-match határeseteire: pontos egyezés, ékezet/rag
      eltérés, teljesen más név)

### 4. Backend — Kedvenc kajék domain
- [ ] egyszerű CRUD (repository/service/handler)
- [ ] unit tesztek

### 5. Backend — Statisztika végpont(ok)
- [ ] havi összesítők, kategória-bontás, `paidBy`-bontás, kaja-gyakoriság lekérdezések
- [ ] unit tesztek a számítási logikára (a meglévő trip-statisztika teszt-mintájára)

### 6. Frontend — Home item-típus regisztrálása
- [ ] `HOME` hozzáadása a 6, fent felsorolt `Record<ItemType,...>` helyhez
- [ ] ikon/megjelenés az item-listában és az "Új elem" formban
- [ ] `NewItemClient.tsx` név-placeholder és típus-specifikus mezők (ha kell induláskor)

### 7. Frontend — Kiadások és Bevételek tab
- [ ] lista komponens (szűrés hónap szerint, típus szerint)
- [ ] form komponens (típus/kategória/összeg/"Ki" dropdown/bolt-hely mező/dátum/megjegyzés)
- [ ] szerkesztés/törlés

### 8. Frontend — Főzés napló tab
- [ ] lista komponens
- [ ] form komponens + fuzzy-match megerősítő dialógus UX
- [ ] opcionális kiadás-kapcsolat választó
- [ ] opcionális bevásárlólista-tétel(ek) hozzárendelése ("ezekből főztem") + "Bevásárlólistára"
      gyorsgomb, ami új `ShoppingListItem` sorokat hoz létre `cookingLogEntryId`-vel

### 9. Frontend — Kedvenc kajék tab
- [ ] lista + hozzáadás/szerkesztés/törlés
- [ ] (extra, opcionális) "Ezt főztem ma" gyorsgomb → előtöltött főzés-napló form

### 10. Frontend — Statisztika tab
- [ ] a tervben felsorolt chartok/stat tile-ok, a meglévő `--chart-1..5` tokenekkel

### 11. i18n
- [ ] minden új felirat hu+en (a projekt jelenleg angol UI szöveget használ hardkódoltan —
      ellenőrizni kell, hogy ez még mindig így van-e, és követni a meglévő konvenciót)

### 12. Tesztelés és élesítés
- [ ] `pnpm typecheck` / `pnpm test:unit` / `pnpm test:e2e:mock`
- [ ] valódi funkcionális teszt élesben (nem csak build/typecheck) — létrehozni egy teszt
      "Otthon" elemet, néhány kiadást/bevételt/főzés-bejegyzést, ellenőrizni a statisztikákat
- [ ] branch + PR, kis, logikus commitokban (a projekt szokásos workflow-ja szerint)

## Amit ez a kör szándékosan NEM tartalmaz

- Alapanyag-szintű (ingredient-level) strukturált adatbevitel/statisztika a főzés-naplóban.
- `paidBy` valódi user-referenciává alakítása (marad free-text dropdown).
- Élő autocomplete a kaja-nevekhez (csak beküldéskori fuzzy-check, a döntés szerint).
- PROPERTY-típus bármilyen módosítása — a HOME teljesen független, új típus.
- `InventoryItem` (raktárkészlet) automatikus fogyás-követése főzéskor (strukturált
  alapanyag-mennyiség kellene hozzá, ami ellentmond a szabad-szöveges MVP-döntésnek).
- **Megosztott hozzáférés / collaborator-mechanizmus a Home elemhez** (hogy Dori is be tudjon
  jelentkezni és saját maga rögzítsen kiadást, ne csak egy név legyen a "Ki" dropdownban) —
  jó ötlet, de **ez nem ehhez a funkcióhoz kötött, hanem egy általánosabb, a teljes appot
  érintő kérdés** (bármelyik Item-et érintheti, nem csak a Home-ot), ezért külön, saját
  tervezést igénylő PR-ként kezelendő, nem ennek a körnek a része.
