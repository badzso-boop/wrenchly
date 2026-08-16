# Sport tracker mint Custom Domain — terv

## Döntés: Custom Domain, nem új natív ItemType

A projekt már tartalmaz egy teljes "Custom Domain" rendszert (`server/domains/custom-domain/*`,
`/custom-domains` UI, Store + import), aminek pontosan az a célja, hogy áthidalja azt, ami nincs
natívan a `ItemType` enumban (`VEHICLE`, `PROPERTY`, `PLANT`, ... `CUSTOM`). Egy sportnaplónak
nincs szüksége séma-migrációra, új `*Profile` modellre, új handler/service/repository rétegre —
mindezt a Custom Domain builder már tudja, admin felületről, élő DB-módosítás nélkül.

Egy natív `SPORT` ItemType hozzáadása ezzel szemben:
- `ItemType` enum bővítés → Prisma migráció → élő DB-n engedélyköteles séma-módosítás
- új `SportProfile` modell + repository/service/handler réteg
- `TYPE_ICONS`, `maintenance.categories.ts`, `profile.fields.ts`, `reading.fields.ts`,
  `trip.labels.ts` — mind helyet érint, ahol az `ItemType` enum switch-elve van
- ~egy nap munka egy funkcióért, ami már megoldható a meglévő rendszerrel

**Ezért a Custom Domain utat választjuk.**

## Emoji a Custom Domainhez — már megvan

A `CustomDomain.icon` mező (String, opcionális) már létezik a séma és a UI szintjén is:
`CustomDomainManager.tsx`-ben a "New custom domain" form már tartalmaz egy "Icon (emoji)" mezőt
(`src/components/domains/custom-domain/CustomDomainManager.tsx:276-279`), és mind a saját listában,
mind a Store kártyákon meg is jelenik az emoji a név előtt. Nincs itt teendő — ezt nem kell újra
megépíteni, csak használni kell létrehozáskor (pl. 🏃).

## Sportok, amiket érdemes statisztikában vezetni

Egyetlen, rugalmas "Sport" domain javasolt (nem sportáganként külön domain elsőre) — egy
`ENUM` "Sport típusa" mezővel, hogy egy naplóban minden hobbisport elférjen, aztán a Log-tab
riportjai szűrhetők típus szerint:

| Sport | Miért éri meg mérni |
|---|---|
| Futás | táv (km), idő, tempó (perc/km), pulzus |
| Kerékpározás | *(már natívan lefedve `BICYCLE` ItemType-tal — ha csak hobbi-edzésnaplót akarsz, ide is felveheted)* |
| Úszás | táv (m/hossz), idő, medence típus |
| Edzőterem / erősítő edzés | súly, ismétlésszám, szettek, gyakorlat neve |
| Csapatsport (foci, kosár, stb.) | időtartam, eredmény/pontszám, helyszín |
| Tenisz / padel | időtartam, eredmény, ellenfél |
| Túrázás | táv (km), szintemelkedés (m), időtartam |

## Javasolt mezőstruktúra a "Sport" Custom Domainhez

**Profile mezők** (egyszeri, az Itemhez tartozó adat):
- Sport típusa alapértelmezetten (ENUM, nem kötelező) — csak tájékoztató, mert a Log-tabon
  soronként is felülírható

**Log-tab mezők** (`loggable: true`, minden edzésnél kitöltve):
- Sport típusa — ENUM: Futás / Kerékpár / Úszás / Edzőterem / Csapatsport / Tenisz-Padel / Túrázás / Egyéb
- Időtartam (perc) — NUMBER, kötelező
- Táv (km) — NUMBER, opcionális (edzőteremnél nem releváns)
- Kalória — NUMBER, opcionális
- Megterhelés (RPE 1-10) — NUMBER, opcionális, min 1 / max 10
- Megjegyzés — TEXT, opcionális

Ez a struktúra minden fenti sportot lefed anélkül, hogy sportáganként külön domaint kellene
építeni és publikálni. Ha valamelyik sport (pl. edzőterem: gyakorlat/szett/ismétlés bontásban)
később saját, részletesebb naplót érdemel, az egy külön Custom Domain lehet — de ez már egy
második iteráció, nem blokkolja az elsőt.

## Hogyan építsd meg és teszteld te magad (UI-flow)

1. `/custom-domains` → **New custom domain** → Name: `Sport`, Icon: `🏃`
2. A domain sorát kinyitva **Add field** a Profile szekcióban, ha akarsz profil-szintű mezőt
   (opcionális, kihagyható)
3. A **Log tab builder** szekcióban vedd fel a fenti loggable mezőket sorban (ENUM Sport típusa,
   NUMBER Időtartam, NUMBER Táv, NUMBER Kalória, NUMBER RPE, TEXT Megjegyzés) — mindegyiknél
   beállítható a `widthCols` (fél/teljes szélesség a Log form rácsában)
4. Ha legalább egy loggable mező kész: **Publish to the store** (🚀 ikon) — ez lezárja a
   mezőstruktúrát, de ez után is lehet mintaadatot szerkeszteni a **My published domains** alatt
5. Hozz létre egy `CUSTOM` típusú Itemet (`/items/new`), csatold hozzá a Sport domaint
6. Menj az Item **Log** fülére, és rögzíts pár valós edzést — ez a tényleges user flow teszt
7. Ellenőrizd a `/custom-domains/store`-on, hogy a publikált Sport domain megjelenik-e, és hogy
   import után (másik teszt-userrel, vagy saját magaddal egy második klónnal) helyesen működik-e

Ezt szándékosan **nem** automatizáltam script/seed formájában — a user flow tesztelését te
szeretted volna elvégezni élőben.

## Kód szintű kiegészítés, amit ehhez a PR-hez elkészítettem

A user flow körül két, a meglévő rendszert additívan bővítő változtatás, séma-migráció nélkül
(a `sourceDomainId` oszlop már létezik, csak eddig nem volt rá lekérdezés):

1. **Store — "legtöbbet importált" rendezés és jelvény**
   (`custom-domain.repository.ts` `listPublished()`): minden publikált domainhez kiszámolja,
   hány másik `CustomDomain` sor mutat rá `sourceDomainId`-n keresztül (= hányszor importálták),
   és eszerint rendezi csökkenőbe a listát. A Store UI-n (`CustomDomainStoreClient.tsx`) ez egy
   🔥-jelvény + darabszám a kártyán, és egy "Most imported" szekció-fejléc a lista tetején, ha
   van legalább egy importált domain.
2. **Dashboard — Store reklám-kártya**: a `/dashboard`-on (`DashboardClient.tsx`), ha a
   felhasználónak van már legalább egy aktív itemje, de még egyik sem `CUSTOM` típusú, megjelenik
   egy szaggatott keretű kártya "Track something we don't cover yet" szöveggel, ami a
   `/custom-domains/store`-ra visz. Csak addig jelenik meg, amíg a user ki nem próbálja a Custom
   Domain rendszert — utána eltűnik, nem nyomasztja folyamatosan a régi felhasználókat.

Mindkettő tesztelve: `pnpm typecheck` tiszta, `pnpm test:unit` 334/334 zöld.
