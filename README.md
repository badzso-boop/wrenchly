# Wrenchly

Maintenance tracker: "sose felejts el egy olajcserét sem" — nyilvántartod a birtokodban lévő dolgokat
(jármű, ingatlan, növény, 3D nyomtató, kisállat, kerékpár, akvárium, medence, hajó, drón, hangszer,
napelemes rendszer, vagy bármi egyéni domain), és a rendszer emlékeztet a karbantartásukra
(push, email, naptár export).

Monorepo: webes app (Next.js) + mobil app (Expo/React Native), közös típusokkal és fordításokkal.

## Funkciók

- **Item tracking** tetszőleges tárgytípusra, típus-specifikus profillal (`VehicleProfile`,
  `PropertyProfile`, `PlantProfile`, `Printer3dProfile`, `PetProfile`, `BicycleProfile`,
  `AquariumProfile`, `PoolProfile`, `BoatProfile`, `DroneProfile`, `InstrumentProfile`,
  `SolarProfile`)
- **Egyéni domain/mező** támogatás (`CustomDomain`, `CustomDomainField`, `CustomItemData`) azokra
  az esetekre, amikre nincs beépített profil
- **Karbantartási napló** (`MaintenanceRecord`) alkatrészekkel (`Part`) és fotókkal (`Photo`)
- **Emlékeztetők** (`Reminder`) dátum-, intervallum- vagy cron-alapú triggerrel, csendes órákkal
- **Smart notification** — időjárás-alapú triggerek (pl. fagyveszély, locsolási emlékeztető)
- **Inventory / bevásárlólista** (`InventoryItem`, `ShoppingListItem`)
- **Naptár export** (iCal/.ics) az emlékeztetőkhöz
- **Push + email értesítések**, felhasználói értesítési preferenciákkal
- **Onboarding flow**, exportálható/megosztható item-adatlapok (`ShareExport`)
- Lokalizáció: `hu` + `en`

## Tech stack

| Réteg | Technológia |
|---|---|
| Web app | Next.js 15 (App Router), React 19, TypeScript, Tailwind 4, shadcn/base-ui |
| API | tRPC 11, réteges architektúra (`handler → service → repository`) — ld. `wrenchly-architecture.md` |
| Adatbázis | PostgreSQL, Prisma ORM (bármilyen Postgres — self-hosted, Neon, RDS, stb.) |
| Auth | [Better Auth](https://www.better-auth.com/) — email+jelszó, saját `users` táblán (Prisma) |
| Mobil app | Expo (React Native) + Expo Router, NativeWind |
| Monorepo | pnpm workspaces + Turborepo |
| Tesztek | Vitest (unit/integration), Playwright (e2e, mock + real backend) |

## Auth: Better Auth (nincs külső auth-szolgáltató)

A projekt korábban Supabase Auth-ot használt — ezt kivettük, most [Better Auth](https://www.better-auth.com/)
kezeli a bejelentkezést, közvetlenül a saját Postgres adatbázisban (Prisma-n keresztül), külső
szolgáltató nélkül:

- **Szerver** (`src/lib/auth/auth.ts`) — `betterAuth()` a `users`/`sessions`/`accounts`/`verifications`
  táblákon dolgozik (ld. `prisma/schema.prisma`), email+jelszó bejelentkezéssel.
- **API route** (`src/app/api/auth/[...all]/route.ts`) — a Better Auth REST végpontjait szolgálja ki
  (`/api/auth/sign-in/email`, `/api/auth/sign-up/email`, `/api/auth/sign-out`, stb.).
- **Web kliens** (`src/lib/auth/client.ts`, React) — cookie-alapú session, a böngésző automatikusan
  kezeli.
- **Mobil (Expo)** — nincs cookie jar React Native-ben, ezért a mobil app közvetlen `fetch`-csel hívja
  a fenti végpontokat (`apps/mobile/src/lib/auth.ts`), a válaszban kapott `token`-t SecureStore-ban
  tárolja, és minden tRPC hívásnál `Authorization: Bearer <token>` fejlécként küldi. A szerveren ezt
  a `bearer` plugin fogadja (`auth.api.getSession()` mindkét utat — cookie és Bearer — ugyanúgy kezeli,
  ld. `src/server/trpc.ts`).
- **Middleware** (`src/middleware.ts`) csak a session-cookie meglétét nézi (Edge runtime, nem érheti el
  a DB-t) — a tényleges session-ellenőrzés minden védett oldalon (`getServerSession()`,
  `src/lib/auth/server.ts`) újra megtörténik, defense-in-depth.

Mivel az auth már nem külső szolgáltatótól függ, a `DATABASE_URL`/`DIRECT_URL` **bármilyen Postgres-re**
mutathat — self-hosted konténerre, Neon-ra, RDS-re, vagy akár Supabase-nek *csak* a Postgres részére
(Auth nélkül). A Docker Compose setup (lásd lejjebb) alapból egy helyi Postgres konténert indít.

**Külső függőségek (mindegyikhez saját fiók/API-kulcs kell):**

| Szolgáltatás | Mire | Env var(ok) |
|---|---|---|
| **Resend** | Tranzakciós email (emlékeztetők, stb.) — `src/server/domains/notification/email.service.ts` | `RESEND_API_KEY` |
| **Expo Push** (`expo-server-sdk`) | Mobil push értesítések — `src/server/domains/notification/push.service.ts`. Nem igényel saját API-kulcsot, a felhasználó Expo push tokenjét használja. | – |
| **Open-Meteo** (`api.open-meteo.com`) | Ingyenes, kulcs nélküli időjárás API a smart notification triggerekhez — `src/server/domains/weather/weather.service.ts` | – |

A `ical-generator` és `cron-parser` csomagok lokálisan futnak, nincs hozzájuk külső szolgáltatás.

*(Az eredeti Vercel-alapú tervben volt még egy Upstash Redis függőség tRPC rate limitinghez — annak
csak azért volt szüksége külső Redis-re, mert szerverless függvényeknek nincs saját memóriájuk
requestek között. Ez a self-hosted, egyetlen hosszan futó Node process esetén felesleges
komplexitás lett volna, ezért kivettük — jelenleg nincs rate limiting a tRPC rétegben.)*

**Fontos:** a rendszer nélkülük (dummy env-ekkel) nem indul el production módban — a
`src/env.ts` (`@t3-oss/env-nextjs`) importkor validál, és minden fenti kulcsot kötelezőnek jelöl
(a `BETTER_AUTH_SECRET`-et is — generáld pl. `openssl rand -base64 32`-vel).
Fejlesztéshez/build teszthez a `SKIP_ENV_VALIDATION=true` env-vel meg lehet kerülni.

## Lokális fejlesztés

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # töltsd ki a valós kulcsokkal
pnpm --filter @wrenchly/web db:generate
pnpm --filter @wrenchly/web db:migrate         # ha még nincsenek meg a táblák a Postgres-ben
pnpm dev                                       # turbo run dev, minden app-ot elindít
```

Tesztek:

```bash
pnpm --filter @wrenchly/web test:unit
pnpm --filter @wrenchly/web test:e2e:mock      # mock backenddel, valós auth/DB nélkül
pnpm typecheck
```

## Docker / self-hosted deploy

A repó gyökerében van egy `Dockerfile` (pnpm workspace-aware, multi-stage, Next.js
`output: standalone` build) és egy `docker-compose.yml`.

A compose stack **saját Postgres konténert is indít** (`db`, `postgres:16-alpine`) — nincs szükség
külső Supabase/Neon/RDS projektre, bár ha mégis azt szeretnél, a `.env`-ben felülírható a
`DATABASE_URL`/`DIRECT_URL` (ld. `docker-compose.yml` a pontos fallback-logikáért).

1. Hozz létre egy `.env` fájlt a repó gyökerében (**nem** `apps/web/` alatt — a `docker-compose.yml`
   onnan olvassa) az `apps/web/.env.example` alapján, valós `BETTER_AUTH_SECRET`/Resend
   kulcsokkal.
2. Build + indítás:

   ```bash
   docker compose up -d --build
   ```

   Az app a konténeren belül a 3000-es porton fut, kifelé `127.0.0.1:8086`-on érhető el.
3. A `docker-compose.yml` egy [`ofelia`](https://github.com/mcuadros/ofelia) sidecart is indít,
   ami a Vercel `vercel.json` cron-jait váltja ki (`/api/cron/reminders` naponta 06:00,
   `/api/cron/weather` 6 óránként, `/api/cron/inventory` naponta 07:00 UTC), `CRON_SECRET`
   Bearer tokennel hitelesítve.
4. DB migráció (első indításkor, vagy sémaváltás után) — a futó `wrenchly` konténer (Next.js
   standalone runtime) nem tartalmazza a Prisma CLI-t, ezért egy külön, a teljes builder réteget
   újrahasznosító one-off service-t kell hozzá futtatni:

   ```bash
   docker compose run --rm migrate
   ```

### Reverse proxy — wrenchly.ujjweb.hu

Az nginx vhost sablon a `deploy/nginx/wrenchly.ujjweb.hu.conf` fájlban van (`127.0.0.1:8086`-ra
proxyz, ugyanaz a minta, mint a többi `*.ujjweb.hu` alszolgáltatásnál ezen a szerveren).

Élesítéshez a szerveren:

```bash
sudo cp deploy/nginx/wrenchly.ujjweb.hu.conf /etc/nginx/sites-available/wrenchly.ujjweb.hu
sudo ln -s /etc/nginx/sites-available/wrenchly.ujjweb.hu /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Mivel a szerver forgalma Cloudflare Tunnel-en jön be, a `wrenchly.ujjweb.hu` hostname-et fel kell
venni az `/etc/cloudflared/config.yml` ingress listájába is (a többi `*.ujjweb.hu` bejegyzés mintájára,
`service: http://localhost:80`), majd `sudo systemctl restart cloudflared`, és ha még nincs DNS
rekord hozzá, azt is létre kell hozni a Cloudflare oldalon (vagy `cloudflared tunnel route dns`-sel).

## Monorepo szerkezet

```
wrenchly/
├── apps/
│   ├── web/       — Next.js app (App Router, tRPC, Prisma, Better Auth)
│   └── mobile/    — Expo/React Native app
├── packages/
│   ├── schema/    — megosztott zod séma
│   ├── types/     — megosztott TS típusok
│   └── i18n/      — hu/en fordítások
├── wrenchly-architecture.md    — réteges architektúra terv
├── wrenchly-schema.md          — adatmodell dokumentáció
├── wrenchly-financial-plan.md  — pénzügyi terv
└── wrenchly-marketing-plan.md  — marketing terv
```

Részletes architektúra-leírásért ld. `wrenchly-architecture.md`, adatmodellért `wrenchly-schema.md`.
