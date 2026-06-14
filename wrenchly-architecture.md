# Wrenchly – Architekturális terv

---

## ALAPELV: Layered Architecture

Minden domain ugyanazt a 3 réteg struktúrát követi:

```
HTTP kérés / tRPC hívás
        ↓
   [ Handler ]      ← bemeneti validáció, HTTP/tRPC réteg
        ↓
   [ Service ]      ← üzleti logika, számítások, rule-ok
        ↓
   [ Repository ]   ← adatbázis műveletek (csak Prisma hívások)
        ↓
   [ Supabase DB ]
```

**Miért ez?**
- Handler tesztelése: üzleti logika nélkül, csak validáció és routing
- Service tesztelése: adatbázis nélkül, mock repository-val
- Repository tesztelése: valódi DB-vel, integráció tesztben
- Bármely réteg cserélhető a többi érintése nélkül

---

## MAPPASTRUKTÚRA

```
wrenchly/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/                        ← Next.js App Router (pages, layouts)
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── register/page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── items/
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   └── api/trpc/[trpc]/route.ts
│   │   │   │
│   │   │   ├── server/                     ← BACKEND RÉTEG
│   │   │   │   ├── db.ts                   ← Prisma client singleton
│   │   │   │   ├── trpc.ts                 ← tRPC init, context, middleware
│   │   │   │   ├── router.ts               ← root router (összes domain összefűzve)
│   │   │   │   │
│   │   │   │   └── domains/
│   │   │   │       ├── item/
│   │   │   │       │   ├── item.handler.ts
│   │   │   │       │   ├── item.service.ts
│   │   │   │       │   ├── item.repository.ts
│   │   │   │       │   ├── item.schema.ts
│   │   │   │       │   └── item.types.ts
│   │   │   │       │
│   │   │   │       ├── maintenance/
│   │   │   │       │   ├── maintenance.handler.ts
│   │   │   │       │   ├── maintenance.service.ts
│   │   │   │       │   ├── maintenance.repository.ts
│   │   │   │       │   ├── maintenance.schema.ts
│   │   │   │       │   └── maintenance.types.ts
│   │   │   │       │
│   │   │   │       ├── reminder/
│   │   │   │       │   ├── reminder.handler.ts
│   │   │   │       │   ├── reminder.service.ts
│   │   │   │       │   ├── reminder.repository.ts
│   │   │   │       │   ├── reminder.schema.ts
│   │   │   │       │   └── reminder.types.ts
│   │   │   │       │
│   │   │   │       ├── vehicle/
│   │   │   │       │   ├── vehicle.handler.ts
│   │   │   │       │   ├── vehicle.service.ts
│   │   │   │       │   ├── vehicle.repository.ts
│   │   │   │       │   ├── vehicle.schema.ts
│   │   │   │       │   └── vehicle.types.ts
│   │   │   │       │
│   │   │   │       ├── plant/
│   │   │   │       ├── property/
│   │   │   │       ├── printer3d/
│   │   │   │       ├── pet/
│   │   │   │       ├── bicycle/
│   │   │   │       └── ...további domének
│   │   │   │
│   │   │   ├── lib/                        ← FRONTEND SEGÉDKÓD
│   │   │   │   ├── trpc/
│   │   │   │   │   ├── client.ts           ← tRPC React kliens
│   │   │   │   │   └── server.ts           ← server-side tRPC hívások
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts           ← browser Supabase kliens
│   │   │   │   │   └── server.ts           ← szerver Supabase kliens
│   │   │   │   ├── utils/
│   │   │   │   │   ├── date.utils.ts       ← dátum formázás, diff számítás
│   │   │   │   │   ├── cost.utils.ts       ← költség összesítés, Ft/km
│   │   │   │   │   ├── reminder.utils.ts   ← következő időpont kalkuláció
│   │   │   │   │   ├── odometer.utils.ts   ← km-alapú trigger számítás
│   │   │   │   │   └── format.utils.ts     ← szám, pénznem, mértékegység
│   │   │   │   └── hooks/
│   │   │   │       ├── useItems.ts
│   │   │   │       ├── useMaintenanceRecords.ts
│   │   │   │       └── useReminders.ts
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/                     ← alap UI komponensek (Button, Input, Card...)
│   │   │   │   ├── layout/                 ← Sidebar, Header, MobileNav
│   │   │   │   └── domains/                ← domain-specifikus komponensek
│   │   │   │       ├── item/
│   │   │   │       │   ├── ItemCard.tsx
│   │   │   │       │   ├── ItemList.tsx
│   │   │   │       │   └── ItemForm.tsx
│   │   │   │       ├── maintenance/
│   │   │   │       │   ├── MaintenanceTimeline.tsx
│   │   │   │       │   ├── MaintenanceForm.tsx
│   │   │   │       │   └── PartsList.tsx
│   │   │   │       └── reminder/
│   │   │   │           ├── ReminderCard.tsx
│   │   │   │           └── ReminderForm.tsx
│   │   │   │
│   │   │   └── store/                      ← Zustand globális state
│   │   │       ├── ui.store.ts             ← sidebar nyitva/zárva, modal state
│   │   │       └── filters.store.ts        ← aktív szűrők, rendezés
│   │   │
│   │   ├── __tests__/
│   │   │   ├── unit/                       ← unit tesztek (mock DB)
│   │   │   │   ├── domains/
│   │   │   │   │   ├── item.service.test.ts
│   │   │   │   │   ├── maintenance.service.test.ts
│   │   │   │   │   ├── reminder.service.test.ts
│   │   │   │   │   └── vehicle.service.test.ts
│   │   │   │   └── utils/
│   │   │   │       ├── date.utils.test.ts
│   │   │   │       ├── reminder.utils.test.ts
│   │   │   │       └── odometer.utils.test.ts
│   │   │   │
│   │   │   └── integration/                ← integrációs tesztek (valódi DB)
│   │   │       ├── setup.ts                ← DB kapcsolat, cleanup helpers
│   │   │       ├── item.integration.test.ts
│   │   │       ├── maintenance.integration.test.ts
│   │   │       └── vehicle.integration.test.ts
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   │
│   │   └── vitest.config.ts
│   │
│   └── mobile/
│       ├── src/
│       │   ├── app/                        ← Expo Router képernyők
│       │   ├── lib/
│       │   │   └── trpc/
│       │   │       └── client.ts           ← ugyanaz az API kliens mint weben
│       │   └── components/
│       └── ...
│
└── packages/
    ├── ui/                                 ← megosztott komponensek
    ├── types/                              ← megosztott TypeScript típusok
    └── schema/                             ← megosztott Zod sémák
```

---

## BACKEND RÉTEGEK RÉSZLETESEN

### Repository – csak adatbázis, semmi más

```typescript
// server/domains/vehicle/vehicle.repository.ts

export class VehicleRepository {
  constructor(private db: PrismaClient) {}

  async findByItemId(itemId: string): Promise<VehicleProfile | null> {
    return this.db.vehicleProfile.findUnique({ where: { itemId } })
  }

  async create(data: CreateVehicleProfileInput): Promise<VehicleProfile> {
    return this.db.vehicleProfile.create({ data })
  }

  async update(itemId: string, data: UpdateVehicleProfileInput): Promise<VehicleProfile> {
    return this.db.vehicleProfile.update({ where: { itemId }, data })
  }

  async updateOdometer(itemId: string, km: number): Promise<VehicleProfile> {
    return this.db.vehicleProfile.update({
      where: { itemId },
      data: { currentOdometer: km, lastOdometerUpdate: new Date() }
    })
  }
}
```

**Szabályok:**
- Csak Prisma hívások, semmi üzleti logika
- Nincs `if`, `switch`, kalkuláció
- Tesztben könnyen mockolható

---

### Service – üzleti logika, szabályok

```typescript
// server/domains/vehicle/vehicle.service.ts

export class VehicleService {
  constructor(
    private vehicleRepo: VehicleRepository,
    private itemRepo: ItemRepository,
    private reminderService: ReminderService,
  ) {}

  async updateOdometer(itemId: string, userId: string, newKm: number) {
    const vehicle = await this.vehicleRepo.findByItemId(itemId)
    if (!vehicle) throw new TRPCError({ code: 'NOT_FOUND' })

    // Üzleti szabály: km csak nőhet
    if (newKm < vehicle.currentOdometer) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Az új km-óra állás nem lehet kisebb a jelenleginél'
      })
    }

    await this.vehicleRepo.updateOdometer(itemId, newKm)

    // Km-alapú reminderek kiértékelése
    await this.reminderService.evaluateOdometerTriggers(itemId, newKm)
  }

  async getMaintenanceDue(itemId: string): Promise<MaintenanceDueItem[]> {
    // Közelgő karbantartások számítása (km + dátum alapján)
    ...
  }
}
```

**Szabályok:**
- Nincs közvetlen Prisma hívás – csak repository metódusok
- Minden üzleti rule itt van
- Unit tesztben a repository mock-olva van

---

### Handler – tRPC router, validáció

```typescript
// server/domains/vehicle/vehicle.handler.ts

export const vehicleRouter = createTRPCRouter({

  getByItemId: protectedProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.vehicle.getByItemId(input.itemId, ctx.userId)
    }),

  updateOdometer: protectedProcedure
    .input(UpdateOdometerSchema)       // Zod séma a packages/schema-ból
    .mutation(async ({ ctx, input }) => {
      return ctx.services.vehicle.updateOdometer(
        input.itemId,
        ctx.userId,
        input.odometer
      )
    }),

  create: protectedProcedure
    .input(CreateVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.vehicle.create(input, ctx.userId)
    }),
})
```

**Szabályok:**
- Csak input validáció (Zod) és service hívás
- Auth check a `protectedProcedure` middleware-ben van
- Nincs üzleti logika

---

### Root Router – összes domain összefűzve

```typescript
// server/router.ts

export const appRouter = createTRPCRouter({
  item:        itemRouter,
  maintenance: maintenanceRouter,
  reminder:    reminderRouter,
  vehicle:     vehicleRouter,
  plant:       plantRouter,
  property:    propertyRouter,
  printer3d:   printer3dRouter,
  pet:         petRouter,
  bicycle:     bicycleRouter,
})

export type AppRouter = typeof appRouter
// Ez az egyetlen type amit a frontend importál – így type-safe az egész API
```

---

## TESZTELÉSI STRATÉGIA

### Unit tesztek (Vitest + mock repository)

```typescript
// __tests__/unit/domains/vehicle.service.test.ts

describe('VehicleService', () => {

  // Mock repository – nem kell valódi DB
  const mockVehicleRepo = {
    findByItemId: vi.fn(),
    updateOdometer: vi.fn(),
  }
  const mockReminderService = {
    evaluateOdometerTriggers: vi.fn(),
  }

  const service = new VehicleService(
    mockVehicleRepo as any,
    mockReminderService as any,
  )

  beforeEach(() => vi.clearAllMocks())

  it('updateOdometer – visszadob hibát ha az új km kisebb', async () => {
    mockVehicleRepo.findByItemId.mockResolvedValue({
      currentOdometer: 50000
    })

    await expect(
      service.updateOdometer('item-1', 'user-1', 49000)
    ).rejects.toThrow('nem lehet kisebb')
  })

  it('updateOdometer – meghívja a reminder kiértékelést', async () => {
    mockVehicleRepo.findByItemId.mockResolvedValue({ currentOdometer: 50000 })
    mockVehicleRepo.updateOdometer.mockResolvedValue({})

    await service.updateOdometer('item-1', 'user-1', 55000)

    expect(mockReminderService.evaluateOdometerTriggers)
      .toHaveBeenCalledWith('item-1', 55000)
  })
})
```

```typescript
// __tests__/unit/utils/reminder.utils.test.ts

describe('calculateNextOdometerReminder', () => {
  it('10 000 km-enként olajcsere – helyes következő km', () => {
    const result = calculateNextOdometerReminder({
      lastDoneAtKm: 45000,
      intervalKm: 10000,
    })
    expect(result).toBe(55000)
  })
})
```

---

### Integrációs tesztek (valódi Supabase test DB)

```typescript
// __tests__/integration/setup.ts

import { PrismaClient } from '@prisma/client'

// Test DB URL a .env.test-ből (külön Supabase project vagy schema)
export const testDb = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL
})

// Helper: teszt user létrehozása és törlése
export async function withTestUser(
  fn: (userId: string) => Promise<void>
) {
  const user = await testDb.user.create({
    data: { email: `test-${Date.now()}@wrenchly.test`, name: 'Test User' }
  })
  try {
    await fn(user.id)
  } finally {
    // Cleanup – minden adat törlése (cascade)
    await testDb.user.delete({ where: { id: user.id } })
  }
}
```

```typescript
// __tests__/integration/maintenance.integration.test.ts

describe('Maintenance – teljes folyamat', () => {

  it('olajcsere létrehozás → reminder frissítés → következő esedékesség', async () => {
    await withTestUser(async (userId) => {

      // 1. Item létrehozása
      const item = await itemService.create({
        userId,
        name: 'Test Ford Focus',
        type: 'vehicle',
      })

      // 2. VehicleProfile hozzáadása
      await vehicleService.create({
        itemId: item.id,
        userId,
        make: 'Ford',
        model: 'Focus',
        currentOdometer: 50000,
      })

      // 3. Olajcsere reminder beállítása
      await reminderService.create({
        itemId: item.id,
        userId,
        title: 'Olajcsere',
        triggerType: 'odometer',
        triggerConfig: { every_km: 10000, last_done_at_km: 50000 }
      })

      // 4. Karbantartás naplózása
      const record = await maintenanceService.create({
        itemId: item.id,
        userId,
        title: 'Olajcsere',
        category: 'oil_change',
        odometerValue: 50000,
        parts: [
          { name: 'Castrol Edge 5W-40', quantity: 5, unit: 'liter', unitPrice: 4200 }
        ]
      })

      // 5. Ellenőrzés
      expect(record.costTotal).toBe(21000)

      const reminder = await reminderService.getByItemId(item.id)
      expect(reminder[0].nextTriggerAt).toBe(60000) // 50000 + 10000

      // Cleanup a withTestUser finally blokkjában történik
    })
  })
})
```

---

## GITHUB ACTIONS

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:

  # 1. Unit tesztek – gyors, nem kell DB
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm test:unit
        working-directory: apps/web

  # 2. TypeScript type check
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm typecheck

  # 3. Integrációs tesztek – valódi Supabase test project
  integration-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, typecheck]       # csak ha a unit tesztek átmentek
    environment: test                    # GitHub Environment – titkos változók
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm db:migrate
        working-directory: apps/web
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      - run: pnpm test:integration
        working-directory: apps/web
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          DIRECT_URL: ${{ secrets.TEST_DIRECT_URL }}

  # 4. Deploy Vercelre (csak main branch)
  deploy:
    runs-on: ubuntu-latest
    needs: [integration-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Titkos változók (GitHub → Settings → Secrets):**
```
TEST_DATABASE_URL     ← Supabase test project connection string
TEST_DIRECT_URL       ← Supabase direct URL (Prisma migrate-hoz)
VERCEL_TOKEN          ← Vercel API token
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## FRONTEND RÉTEGEK RÉSZLETESEN

### tRPC kliens hook-ok

```typescript
// lib/hooks/useMaintenanceRecords.ts

export function useMaintenanceRecords(itemId: string) {
  const utils = api.useUtils()

  const records = api.maintenance.listByItemId.useQuery({ itemId })

  const createRecord = api.maintenance.create.useMutation({
    onSuccess: () => {
      // Cache invalidálás – automatikusan újratölti a listát
      utils.maintenance.listByItemId.invalidate({ itemId })
      utils.item.getById.invalidate({ id: itemId })
    }
  })

  const deleteRecord = api.maintenance.delete.useMutation({
    onSuccess: () => utils.maintenance.listByItemId.invalidate({ itemId })
  })

  return { records, createRecord, deleteRecord }
}
```

### Utility osztályok

```typescript
// lib/utils/reminder.utils.ts

export function calculateNextOdometerReminder(params: {
  lastDoneAtKm: number
  intervalKm: number
  currentKm: number
}): { nextKm: number; kmRemaining: number; isOverdue: boolean } {
  const nextKm = params.lastDoneAtKm + params.intervalKm
  const kmRemaining = nextKm - params.currentKm
  return {
    nextKm,
    kmRemaining,
    isOverdue: kmRemaining < 0,
  }
}

export function calculateNextDateReminder(params: {
  lastDoneAt: Date
  intervalDays: number
}): { nextDate: Date; daysRemaining: number; isOverdue: boolean } {
  const nextDate = addDays(params.lastDoneAt, params.intervalDays)
  const daysRemaining = differenceInDays(nextDate, new Date())
  return {
    nextDate,
    daysRemaining,
    isOverdue: daysRemaining < 0,
  }
}
```

```typescript
// lib/utils/cost.utils.ts

export function sumMaintenanceCosts(records: MaintenanceRecord[]): number {
  return records.reduce((sum, r) => sum + (r.costTotal ?? 0), 0)
}

export function costPerKm(totalCost: number, totalKm: number): number {
  if (totalKm === 0) return 0
  return totalCost / totalKm
}

export function annualCost(records: MaintenanceRecord[], year: number): number {
  return records
    .filter(r => new Date(r.performedAt).getFullYear() === year)
    .reduce((sum, r) => sum + (r.costTotal ?? 0), 0)
}
```

### Zustand store – UI state

```typescript
// store/ui.store.ts
// CSAK UI state van itt – szerver adatok React Query-ben vannak

interface UIStore {
  sidebarOpen: boolean
  activeItemId: string | null
  toggleSidebar: () => void
  setActiveItem: (id: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeItemId: null,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveItem: (id) => set({ activeItemId: id }),
}))
```

---

## ÖSSZEFOGLALÁS: Mi hol lakik

| Mit teszel | Hol lakik |
|-----------|-----------|
| Adatbázis lekérdezés | `*.repository.ts` |
| Üzleti szabály, kalkuláció | `*.service.ts` |
| Input validáció, routing | `*.handler.ts` |
| Zod sémák (shared) | `packages/schema/` |
| TypeScript típusok (shared) | `packages/types/` |
| API hívás a frontendről | `lib/hooks/use*.ts` |
| Dátum/szám/pénznem formázás | `lib/utils/*.utils.ts` |
| Reminder/odometer számítás | `lib/utils/reminder.utils.ts` |
| Globális UI state | `store/*.store.ts` |
| Szerver adat cache | React Query (tRPC-n belül) |
| Unit teszt | `__tests__/unit/` |
| Integrációs teszt | `__tests__/integration/` |
| CI pipeline | `.github/workflows/ci.yml` |

---

## PACKAGE.JSON SCRIPTEK

```json
{
  "scripts": {
    "dev":              "next dev",
    "build":            "next build",
    "test:unit":        "vitest run __tests__/unit",
    "test:unit:watch":  "vitest __tests__/unit",
    "test:integration": "vitest run __tests__/integration",
    "test:all":         "vitest run",
    "typecheck":        "tsc --noEmit",
    "db:generate":      "prisma generate",
    "db:migrate":       "prisma migrate deploy",
    "db:studio":        "prisma studio"
  }
}
```

---

## BIZTONSÁG

### Supabase Row Level Security (RLS)

A Supabase alapból minden táblát nyitva hagy – bárki olvashat bármit. Az RLS policy-k SQL szabályok, amelyek megszabják, ki mit láthat.

**Alapelv:** minden tábla rendelkezik `user_id` mezővel, és minden RLS policy ugyanarra az egy szabályra épül:
> "Csak a sajátodat láthatod."

```sql
-- items tábla RLS bekapcsolása
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- SELECT: csak saját itemeket látod
CREATE POLICY "users_select_own_items"
  ON items FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: csak a sajátod nevében szúrhatsz be
CREATE POLICY "users_insert_own_items"
  ON items FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: csak a sajátodat módosíthatod
CREATE POLICY "users_update_own_items"
  ON items FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: csak a sajátodat törölheted
CREATE POLICY "users_delete_own_items"
  ON items FOR DELETE
  USING (user_id = auth.uid());
```

**Minden táblára ugyanez vonatkozik:**
```sql
-- maintenance_records, reminders, inventory_items,
-- shopping_list_items, custom_domains, stb.
-- Mindenhol: user_id = auth.uid()
```

**Cascade delete a Prismában** gondoskodik arról, hogy ha a User törlődik, az összes adata is törlődik – nem kell kézzel kezelni.

**Teszt:** az integrációs tesztekben két test usert hozunk létre és ellenőrizzük, hogy az egyik nem látja a másik adatát.

---

### Rate Limiting (Upstash Ratelimit)

```typescript
// server/middleware/rateLimit.ts
// Vercel Edge Middleware – minden API hívás előtt fut

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 kérés / perc / user
})

export async function rateLimitMiddleware(userId: string) {
  const { success, remaining, reset } = await ratelimit.limit(userId)

  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'errors.rate_limit_exceeded',  // i18n kulcs, nem szöveg!
    })
  }
}
```

**Limitek per endpoint típus:**
```
Általános API:     60 kérés / perc / user
Reminder cron:     csak szerver oldali hívás, nem user-triggerable
File upload:       10 feltöltés / perc / user
Auth endpoints:    10 kísérlet / perc / IP  (Supabase Auth beépített védi)
```

---

## OFFLINE MÓD

### Stratégia: Sync Queue + Optimistic UI

```
Felhasználó létrehoz egy karbantartást, nincs net:

1. App menti LocalStorage-ba (MMKV mobilon)
   → syncStatus: 'pending'
   → tempId: 'local_abc123' (valódi ID még nincs)

2. UI azonnal megmutatja az adatot (optimistic)
   → "Offline" badge jelenik meg a kártyán

3. Net visszatér → SyncService lefut
   → Elküldi a szerverre
   → Megkapja a valódi ID-t
   → Törli a local entitást
   → React Query cache frissül

4. Ha a szerver hibát dob (konfliktus stb.)
   → Error state, felhasználó kézzel dönti el
```

### Implementáció

```typescript
// lib/offline/syncQueue.ts

interface PendingOperation {
  id: string           // lokális temp ID
  type: 'create' | 'update' | 'delete'
  entity: 'maintenanceRecord' | 'item' | 'reminder'
  payload: unknown
  createdAt: number    // timestamp
  retryCount: number
}

export class SyncQueue {
  private storage: MMKVStorage  // mobilon MMKV, weben localStorage

  async enqueue(op: Omit<PendingOperation, 'id' | 'retryCount' | 'createdAt'>) {
    const pending = await this.getAll()
    pending.push({ ...op, id: nanoid(), retryCount: 0, createdAt: Date.now() })
    await this.storage.set('sync_queue', JSON.stringify(pending))
  }

  async flush(apiClient: TRPCClient) {
    const pending = await this.getAll()
    for (const op of pending) {
      try {
        await this.execute(op, apiClient)
        await this.remove(op.id)       // siker → töröl
      } catch {
        await this.incrementRetry(op.id)
        if (op.retryCount >= 3) {
          await this.moveToFailed(op)  // 3 próba után failed queue-ba
        }
      }
    }
  }

  async getPendingCount(): Promise<number> {
    return (await this.getAll()).length
  }
}
```

### UI indikátor

```typescript
// components/ui/SyncStatusBadge.tsx
// Megjelenik a header-ben ha van pending sync

export function SyncStatusBadge() {
  const { pendingCount, isSyncing, isOnline } = useSyncStatus()

  if (isOnline && pendingCount === 0) return null

  return (
    <div className="flex items-center gap-1 text-sm">
      {!isOnline && (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
          Offline
        </span>
      )}
      {pendingCount > 0 && (
        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
          {isSyncing ? 'Szinkronizálás...' : `${pendingCount} nem szinkronizált`}
        </span>
      )}
    </div>
  )
}
```

```typescript
// Minden MaintenanceRecordCard-on is látszik:
// ha syncStatus === 'pending' → szürke border + "Offline" felirat a kártyán
```

### Sync trigger pontok
- App előtérbe kerül (AppState változás mobilon)
- Net kapcsolat visszatér (`NetInfo` esemény)
- Manuális "Szinkronizálás" gomb a beállításokban

---

## ONBOARDING & VARÁZSLÓK

### Onboarding flow lépései

```
Lépés 1: Üdvözlő képernyő
  → "Mik az érdeklődési köreid?"
  → Checkbox grid a 17 doménből (ikon + névvel)
  → Minimum 1 kiválasztása kötelező

Lépés 2–N: Minden kiválasztott domainhez egy wizard
  → Sorrend: Vehicle → Property → Pet → Bicycle → Plant → ...
  → Minden wizardban 2-4 képernyő

Utolsó lépés: "Készen állsz!"
  → Dashboard megnyílik az imént létrehozott itemekkel
  → Azonnal látja a közelgő emlékeztetőket
```

### Wizard rendszer architektúrája

```typescript
// lib/onboarding/wizard.types.ts

interface WizardStep {
  id: string
  title: string          // i18n kulcs
  fields: WizardField[]
  condition?: (prev: Record<string, unknown>) => boolean  // feltételes lépés
}

interface WizardField {
  key: string
  type: 'text' | 'select' | 'number' | 'date' | 'checkbox_group'
  label: string          // i18n kulcs
  options?: { value: string; label: string }[]
  required?: boolean
}

interface DomainWizard {
  domain: ItemType
  steps: WizardStep[]
  onComplete: (data: Record<string, unknown>) => Promise<void>
}
```

### Ház wizard (részletes példa)

```typescript
// lib/onboarding/wizards/property.wizard.ts

export const propertyWizard: DomainWizard = {
  domain: 'PROPERTY',
  steps: [
    {
      id: 'basics',
      title: 'onboarding.property.basics',
      fields: [
        { key: 'name', type: 'text', label: 'onboarding.property.name',
          required: true },              // "Otthonunk"
        { key: 'type', type: 'select', label: 'onboarding.property.type',
          options: [
            { value: 'house', label: 'Családi ház' },
            { value: 'apartment', label: 'Lakás' },
            { value: 'garage', label: 'Garázs' },
          ]
        },
        { key: 'yearBuilt', type: 'number', label: 'onboarding.property.year_built' },
      ]
    },
    {
      id: 'heating',
      title: 'onboarding.property.heating',
      condition: (prev) => prev.type !== 'garage',  // garázsnál kihagyja
      fields: [
        { key: 'heatingType', type: 'select', label: 'onboarding.property.heating_type',
          options: [
            { value: 'gas_boiler', label: 'Gázkazán' },
            { value: 'heat_pump', label: 'Hőszivattyú' },
            { value: 'district', label: 'Távhő' },
            { value: 'electric', label: 'Elektromos' },
          ]
        },
        { key: 'boilerBrand', type: 'text', label: 'onboarding.property.boiler_brand' },
      ]
    },
    {
      id: 'appliances',
      title: 'onboarding.property.appliances',
      condition: (prev) => prev.type !== 'garage',
      fields: [
        {
          key: 'appliances',
          type: 'checkbox_group',
          label: 'onboarding.property.select_appliances',
          options: [
            { value: 'washing_machine', label: 'Mosógép' },
            { value: 'dishwasher', label: 'Mosogatógép' },
            { value: 'oven', label: 'Sütő' },
            { value: 'fridge', label: 'Hűtő' },
            { value: 'freezer', label: 'Mélyhűtő' },
            { value: 'ac', label: 'Klíma' },
          ]
        }
      ]
    },
    {
      id: 'extras',
      title: 'onboarding.property.extras',
      fields: [
        {
          key: 'extras',
          type: 'checkbox_group',
          label: 'onboarding.property.select_extras',
          options: [
            { value: 'garden', label: 'Kert' },
            { value: 'pool', label: 'Medence' },
            { value: 'solar', label: 'Napelem' },
            { value: 'garage', label: 'Garázs/Carport' },
          ]
        }
      ]
    }
  ],
  onComplete: async (data) => {
    // 1. Property item létrehozása
    const item = await itemService.create({ type: 'PROPERTY', name: data.name })
    await propertyService.create({ itemId: item.id, ...data })

    // 2. Minden kiválasztott eszköznek saját Item létrehozása (gyerek-item)
    for (const appliance of data.appliances as string[]) {
      await itemService.createFromTemplate(appliance, item.id)
    }

    // 3. Alap reminderek hozzáadása sablonból
    await reminderService.applyTemplate('property_house', item.id)
  }
}
```

### Sablon rendszer (reminderekhezhez)

```typescript
// lib/onboarding/templates/reminders.templates.ts

export const reminderTemplates: Record<string, ReminderTemplate[]> = {

  vehicle_diesel: [
    { title: 'Olajcsere', triggerType: 'odometer', config: { every_km: 15000 } },
    { title: 'Légszűrő', triggerType: 'odometer', config: { every_km: 30000 } },
    { title: 'Pollenszűrő', triggerType: 'interval_days', config: { days: 365 } },
    { title: 'Fékfolyadék csere', triggerType: 'interval_days', config: { days: 730 } },
    { title: 'Téli gumi', triggerType: 'cron', config: { expression: '0 9 1 11 *' } },
    { title: 'Nyári gumi', triggerType: 'cron', config: { expression: '0 9 1 4 *' } },
  ],

  property_house: [
    { title: 'Kazán éves szerviz', triggerType: 'cron', config: { expression: '0 9 1 9 *' } },
    { title: 'Radiátor légtelenítés', triggerType: 'cron', config: { expression: '0 9 15 10 *' } },
    { title: 'Ereszcsatorna tisztítás', triggerType: 'cron', config: { expression: '0 9 1 11 *' } },
    { title: 'Füstérzékelő teszt', triggerType: 'interval_days', config: { days: 90 } },
  ],

  pet_dog: [
    { title: 'Kullancs/bolha kezelés', triggerType: 'interval_days', config: { days: 90 } },
    { title: 'Féreghajtás', triggerType: 'interval_days', config: { days: 90 } },
    { title: 'Éves oltás', triggerType: 'interval_days', config: { days: 365 } },
  ],

  bicycle_mtb: [
    { title: 'Lánc kenés', triggerType: 'odometer', config: { every_km: 150 } },
    { title: 'Lánc nyúlás mérés', triggerType: 'odometer', config: { every_km: 500 } },
    { title: 'Gumi nyomás', triggerType: 'interval_days', config: { days: 7 } },
  ],
}
```

---

## MEGOSZTÁS (SHARING)

### Formátum: `.wrenchly` szövegfájl

Egyszerű, ember által is olvasható, de az app vissza tudja olvasni.
SMS-ben, e-mailben, WhatsApp-on is elküldhető mint szöveg.

```
WRENCHLY/1.0
---
ITEM: Ford Focus 2015
TYPE: vehicle/car
MAKE: Ford | MODEL: Focus | YEAR: 2015
VIN: WVWZZZ3BZ9E123456
ODOMETER: 155420 km
---
LOG | 2026-03-10 | oil_change | Olajcsere | 50000 km | 12500 Ft
  PART: Castrol Edge 5W-40 | oil | 5 liter | 4200 Ft/l
  PART: Mann HU 712/7 szűrő | filter | 1 db | 2800 Ft

LOG | 2025-09-01 | air_filter | Légszűrő csere | 47000 km | 3200 Ft
  PART: Mann C 2674 | filter | 1 db | 3200 Ft

LOG | 2025-03-15 | timing_belt | Vezérszíj csere | 40000 km | 38000 Ft
  NOTE: Vízpumpa is cserélve egyben

REMINDER | Olajcsere | odometer | minden 10000 km | utoljára 50000 km-nél
REMINDER | Légszűrő | odometer | minden 30000 km
REMINDER | Téli gumi | cron | november 1.
---
EXPORTED: 2026-06-13 | wrenchly.app
```

### Import/Export service

```typescript
// server/domains/share/share.service.ts

export class ShareService {

  exportItem(item: ItemWithRecords): string {
    const lines: string[] = ['WRENCHLY/1.0', '---']

    lines.push(`ITEM: ${item.name}`)
    lines.push(`TYPE: ${item.type}/${item.subtype ?? ''}`)

    if (item.vehicleProfile) {
      const v = item.vehicleProfile
      lines.push(`MAKE: ${v.make} | MODEL: ${v.model} | YEAR: ${v.year}`)
      if (v.vin) lines.push(`VIN: ${v.vin}`)
      if (v.currentOdometer) lines.push(`ODOMETER: ${v.currentOdometer} km`)
    }

    lines.push('---')

    for (const record of item.maintenanceRecords) {
      const cost = record.costTotal ? `${record.costTotal} Ft` : ''
      const km = record.odometerValue ? `${record.odometerValue} km` : ''
      lines.push(`LOG | ${formatDate(record.performedAt)} | ${record.category} | ${record.title} | ${km} | ${cost}`.trim().replace(/\s*\|\s*$/, ''))

      for (const part of record.parts) {
        lines.push(`  PART: ${part.name} | ${part.category ?? ''} | ${part.quantity} ${part.unit} | ${part.unitPrice ? part.unitPrice + ' Ft/' + part.unit : ''}`.trim())
      }
      if (record.notes) lines.push(`  NOTE: ${record.notes}`)
    }

    for (const reminder of item.reminders) {
      lines.push(`REMINDER | ${reminder.title} | ${reminder.triggerType} | ...`)
    }

    lines.push('---')
    lines.push(`EXPORTED: ${formatDate(new Date())} | wrenchly.app`)

    return lines.join('\n')
  }

  importFromText(text: string, userId: string): ImportPreview {
    // Visszaolvassa a szöveget és létrehozza az itemet + recordokat
    // Visszaad egy preview-t amit a user megerősít import előtt
    const parsed = this.parseWrenchlyFormat(text)
    return { item: parsed.item, records: parsed.records, reminders: parsed.reminders }
  }
}
```

### Share UI flow

```
Felhasználó megnyomja "Megosztás" az item oldalán
  ↓
Választ: "Szöveg másolása" | "Fájl letöltése (.wrenchly)" | "Küldés"
  ↓
Szöveg esetén: rendszer share sheet (iOS/Android natív megosztás)
  ↓
Fogadó fél megkapja a szöveget
  ↓
App megnyitása → "Importálás" → beilleszti / fájlt megnyitja
  ↓
Preview: "Ez fog importálódni: 1 jármű, 12 karbantartás"
  ↓
Megerősítés → import
```

---

## ÉRTESÍTÉSI DASHBOARD

### NotificationPreference (adatmodell kiegészítés)

```
userId
pushEnabled          – globális push ki/be
emailEnabled         – globális email ki/be
quietHoursFrom       – 22 (este 10)
quietHoursTo         – 8  (reggel 8) – ez között nem küld
advanceDays          – 3 (X nappal előre figyelmeztet)
weeklyDigest         – heti összefoglaló e-mail
```

### Értesítés dashboard UI

```
Beállítások → Értesítések

[Globális kapcsolók]
  🔔 Push értesítések          [ON/OFF]
  📧 Email értesítések         [ON/OFF]
  🌙 Csendes órák              22:00 – 08:00

[Előrejelzés]
  Értesítés X nappal előre:   [3] nap

[Értesítési előzmények]
  ├─ Ma
  │   ├─ ✅ Olajcsere esedékes – Ford Focus     [Elolvasva]
  │   └─ 🔔 Bolha kezelés – Bodri              [Aktív] [Szundi 1 hét]
  └─ Tegnap
      └─ ✅ Radiátor légtelenítés               [Elolvasva]

[Item-szintű finomhangolás]
  Ford Focus 2015
    Olajcsere reminder:       [Push + Email]
    Műszaki vizsga:           [Push + Email]
    Szezonális (gumi):        [Csak push]
```

---

## i18n ARCHITEKTÚRA

### Alap döntés

**Backend soha nem küld szövegeket, csak kulcsokat.**
A frontend fordítja le azokat a felhasználó nyelvére.

```typescript
// ❌ ROSSZ – backend szöveget küld
throw new TRPCError({ message: 'Az új km nem lehet kisebb a réginél' })

// ✅ JÓ – backend kulcsot küld
throw new TRPCError({ message: 'errors.vehicle.odometer_must_increase' })
```

### Mappastruktúra

```
packages/
└── i18n/
    ├── locales/
    │   ├── hu/
    │   │   ├── common.json         ← gombok, általános szavak
    │   │   ├── errors.json         ← backend error kulcsok
    │   │   ├── onboarding.json     ← wizard szövegek
    │   │   ├── domains/
    │   │   │   ├── vehicle.json
    │   │   │   ├── property.json
    │   │   │   └── ...
    │   │   └── notifications.json
    │   └── en/
    │       ├── common.json
    │       ├── errors.json
    │       └── ...
    └── index.ts                    ← típusos export
```

### Fordítási fájl példa

```json
// packages/i18n/locales/hu/errors.json
{
  "errors": {
    "not_found": "A keresett elem nem található.",
    "unauthorized": "Nincs jogosultságod ehhez a művelethez.",
    "rate_limit_exceeded": "Túl sok kérés. Kérjük várj egy percet.",
    "vehicle": {
      "odometer_must_increase": "Az új km-óra állás nem lehet kisebb a jelenleginél.",
      "vin_invalid": "Érvénytelen alvázszám formátum."
    },
    "reminder": {
      "trigger_config_invalid": "Érvénytelen emlékeztető beállítás."
    }
  }
}
```

```json
// packages/i18n/locales/hu/domains/vehicle.json
{
  "vehicle": {
    "oil_change": "Olajcsere",
    "air_filter": "Légszűrő csere",
    "timing_belt": "Vezérszíj csere",
    "categories": {
      "oil_change": "Olajcsere",
      "tire": "Gumi",
      "brakes": "Fék"
    }
  }
}
```

### Integráció Next.js-be és Expo-ba

```typescript
// Web: next-intl
// apps/web/src/app/[locale]/layout.tsx – URL alapú locale (/hu/..., /en/...)

// Mobile: expo-localization + i18next
// Eszköz nyelve alapján automatikus

// Megosztott hook (packages/i18n/useTranslation.ts)
// Web és mobil ugyanazt az interfészt használja
```

---

## EGYEDI DOMAIN RENDSZER (Custom Domains)

### Koncepció

Ha a felhasználó hobbija nincs a 17 beépített közt, létrehozhatja a sajátját.
Megadja a mezők nevét, típusát, egységét – az app teljesen ugyanúgy kezeli mint a beépített domaineket.

**Jövőbeli community funkció:** a felhasználó megoszthatja a domain definícióját, mások importálhatják.

### Adatmodell

```
CustomDomain
  id
  userId
  name          – "Méhészet"
  icon          – "🐝"
  isPublic      – false (csak én látom) / true (community megosztva)

CustomDomainField (a domain mezői)
  id
  customDomainId
  name          – "Kaptár típusa"
  key           – "hive_type"          (programmatic, snake_case)
  fieldType     – TEXT | NUMBER | DATE | BOOLEAN | ENUM | URL
  unit          – "kg", "liter", "°C"  (opcionális)
  required      – true/false
  options       – ["Langstroth", "Dadant", "Warré"]  (ENUM-hoz)
  order         – megjelenési sorrend

CustomItemData
  itemId
  customDomainId
  data          – JSON: { "hive_type": "Langstroth", "colony_count": 3 }
```

### UI: Saját domain létrehozása

```
"+ Új hobbit adok hozzá"
  ↓
Név: [Méhészet          ]
Ikon: [🐝]

Mezők:
  + Mező hozzáadása
  ┌─────────────────────────────────────────┐
  │ Mező neve:    [Kaptár típusa           ]│
  │ Típus:        [Felsorolás (ENUM)    ▼  ]│
  │ Lehetőségek:  Langstroth / Dadant / ... │
  └─────────────────────────────────────────┘
  + Mező hozzáadása
  ┌─────────────────────────────────────────┐
  │ Mező neve:    [Méhcsaládok száma       ]│
  │ Típus:        [Szám                 ▼  ]│
  │ Egység:       [db                      ]│
  └─────────────────────────────────────────┘

[Mentés és tárgy hozzáadása]
```

### Karbantartás kategóriák egyedi domainhez

Az egyedi domain esetén a kategóriák is szabadon definiálhatók:

```
Méhészet karbantartás kategóriák (user definiálja):
  "Kaptár ellenőrzés"
  "Varroa kezelés"
  "Mézpergetés"
  "Teleltetés előkészítés"
  "Anyacsere"
```

### Community megosztás (V2)

```
Felhasználó megosztja a domain definícióját:
  → isPublic: true
  → Megjelenik a "Community domének" szekcióban
  → Más felhasználók importálhatják egy kattintással
  → Kommentelhetnek, értékelhetnek

Community domain oldal:
  🐝 Méhészet – norbert_u által
  ⭐ 4.8  |  142 felhasználó
  Mezők: Kaptár típus, Méhcsalád szám, Kaptár helyszín
  [Importálás] [Részletek]
```

---

## PRISMA SÉMA

```prisma
// apps/web/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")     // Supabase connection pooling miatt szükséges
}

// ─── CORE ────────────────────────────────────────────────────────────────────

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String?
  avatarUrl      String?
  locale         String   @default("en")
  timezone       String   @default("Europe/Budapest")  // csendes órák számításához
  expoPushToken  String?           // Expo push notification token
  defaultLat     Decimal? @db.Decimal(9, 6)   // weather triggerekhez
  defaultLon     Decimal? @db.Decimal(9, 6)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  items                Item[]
  reminders            Reminder[]
  inventoryItems       InventoryItem[]
  shoppingListItems    ShoppingListItem[]
  notificationPref     NotificationPreference?
  customDomains        CustomDomain[]
  onboardingState      OnboardingState?
  shareExports         ShareExport[]
  notifications        SmartNotification[]

  @@map("users")
}

model Item {
  id            String     @id @default(cuid())
  userId        String
  name          String
  type          ItemType
  subtype       String?
  description   String?
  location      String?
  status        ItemStatus @default(ACTIVE)
  purchaseDate  DateTime?
  purchasePrice Decimal?   @db.Decimal(10, 2)
  serialNumber  String?
  warrantyExpiresAt DateTime?
  coverPhotoUrl String?
  parentItemId  String?    // gyerek-item (pl. mosógép a ház alatt)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentItem         Item?               @relation("ItemChildren", fields: [parentItemId], references: [id])
  childItems         Item[]              @relation("ItemChildren")
  maintenanceRecords MaintenanceRecord[]
  reminders          Reminder[]
  photos             Photo[]
  shareExports       ShareExport[]

  vehicleProfile   VehicleProfile?
  propertyProfile  PropertyProfile?
  plantProfile     PlantProfile?
  printer3dProfile Printer3dProfile?
  petProfile       PetProfile?
  bicycleProfile   BicycleProfile?
  aquariumProfile  AquariumProfile?
  poolProfile      PoolProfile?
  boatProfile      BoatProfile?
  droneProfile     DroneProfile?
  instrumentProfile InstrumentProfile?
  solarProfile     SolarProfile?
  customItemData   CustomItemData?

  @@index([userId])
  @@index([userId, type])
  @@index([userId, status])
  @@map("items")
}

enum ItemType {
  VEHICLE
  PROPERTY
  PLANT
  MACHINE
  TOOL
  DEVICE
  PET
  AQUARIUM
  POOL
  BOAT
  DRONE
  INSTRUMENT
  BICYCLE
  SOLAR
  CUSTOM
}

enum ItemStatus {
  ACTIVE
  ARCHIVED
  SOLD
}

model MaintenanceRecord {
  id            String   @id @default(cuid())
  itemId        String
  userId        String
  performedAt   DateTime
  title         String
  description   String?
  category      String
  costTotal     Decimal? @db.Decimal(10, 2)
  costLabor     Decimal? @db.Decimal(10, 2)
  isDiy         Boolean  @default(true)
  timeSpentMin  Int?
  odometerValue Int?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  item   Item    @relation(fields: [itemId], references: [id], onDelete: Cascade)
  parts  Part[]
  photos Photo[]

  @@index([itemId])
  @@index([itemId, performedAt])
  @@index([userId, performedAt])
  @@map("maintenance_records")
}

model Part {
  id                  String   @id @default(cuid())
  maintenanceRecordId String
  name                String
  category            String?
  brand               String?
  partNumber          String?
  quantity            Decimal  @db.Decimal(10, 3)
  unit                String
  unitPrice           Decimal? @db.Decimal(10, 2)
  totalPrice          Decimal? @db.Decimal(10, 2)
  supplier            String?
  url                 String?
  notes               String?

  maintenanceRecord MaintenanceRecord @relation(fields: [maintenanceRecordId], references: [id], onDelete: Cascade)

  @@index([maintenanceRecordId])
  @@map("parts")
}

model Photo {
  id                  String   @id @default(cuid())
  userId              String
  itemId              String?
  maintenanceRecordId String?
  storageUrl          String
  caption             String?
  takenAt             DateTime?
  createdAt           DateTime @default(now())

  item              Item?              @relation(fields: [itemId], references: [id], onDelete: Cascade)
  maintenanceRecord MaintenanceRecord? @relation(fields: [maintenanceRecordId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@index([maintenanceRecordId])
  @@map("photos")
}

model Reminder {
  id              String      @id @default(cuid())
  itemId          String
  userId          String
  title           String
  description     String?
  triggerType     TriggerType
  triggerConfig   Json
  lastTriggeredAt DateTime?
  nextTriggerAt   DateTime?
  isActive        Boolean     @default(true)
  notifyChannels  String[]    @default(["push"])
  snoozeUntil     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  item          Item                @relation(fields: [itemId], references: [id], onDelete: Cascade)
  notifications SmartNotification[]

  @@index([userId, nextTriggerAt])
  @@index([itemId])
  @@index([isActive, nextTriggerAt])   // cron job: összes esedékes reminder user szűrés nélkül
  @@map("reminders")
}

enum TriggerType {
  DATE
  INTERVAL_DAYS
  ODOMETER
  CRON
  WEATHER
  COMPOUND
}

model SmartNotification {
  id           String   @id @default(cuid())
  userId       String
  reminderId   String?
  triggeredAt  DateTime @default(now())
  channel      String
  titleKey     String   // i18n kulcs
  bodyKey      String   // i18n kulcs
  bodyParams   Json?    // interpolációs adatok: { itemName: "Ford Focus" }
  actionUrl    String?
  readAt       DateTime?
  snoozedUntil DateTime?

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminder Reminder? @relation(fields: [reminderId], references: [id], onDelete: SetNull)

  @@index([userId, readAt, triggeredAt])   // notification dashboard: olvasatlan + rendezés
  @@map("smart_notifications")
}

model NotificationPreference {
  id             String  @id @default(cuid())
  userId         String  @unique
  pushEnabled    Boolean @default(true)
  emailEnabled   Boolean @default(false)
  quietHoursFrom Int?
  quietHoursTo   Int?
  advanceDays    Int     @default(3)
  weeklyDigest   Boolean @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

// ─── INVENTORY & SHOPPING ────────────────────────────────────────────────────

model InventoryItem {
  id           String   @id @default(cuid())
  userId       String
  name         String
  category     String
  brand        String?
  spec         String?
  quantity     Decimal  @db.Decimal(10, 3)
  unit         String
  location     String?
  minQuantity  Decimal? @db.Decimal(10, 3)
  costPerUnit  Decimal? @db.Decimal(10, 2)
  expiryDate   DateTime?
  purchaseDate DateTime?
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, minQuantity])   // low stock automatikus ellenőrzés
  @@map("inventory_items")
}

model ShoppingListItem {
  id              String           @id @default(cuid())
  userId          String
  itemId          String?
  name            String
  quantity        Decimal?         @db.Decimal(10, 3)
  unit            String?
  estimatedPrice  Decimal?         @db.Decimal(10, 2)
  storeSuggestion String?
  url             String?
  priority        ShoppingPriority @default(MEDIUM)
  status          ShoppingStatus   @default(PENDING)
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@map("shopping_list_items")
}

enum ShoppingPriority { LOW MEDIUM HIGH URGENT }
enum ShoppingStatus   { PENDING BOUGHT CANCELLED }

// ─── DOMAIN PROFILOK ─────────────────────────────────────────────────────────

model VehicleProfile {
  itemId              String   @id
  make                String
  model               String
  year                Int?
  variant             String?
  vin                 String?
  licensePlate        String?
  color               String?
  fuelType            String?
  engineDisplacement  Int?
  powerKw             Int?
  transmission        String?
  driveType           String?
  oilSpec             String?
  coolantType         String?
  brakeFluidType      String?
  tireSizeFront       String?
  tireSizeRear        String?
  tirePressureFront   Decimal? @db.Decimal(4, 2)
  tirePressureRear    Decimal? @db.Decimal(4, 2)
  currentOdometer     Int?
  lastOdometerUpdate  DateTime?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("vehicle_profiles")
}

model PropertyProfile {
  itemId       String  @id
  propertyType String
  address      String?
  yearBuilt    Int?
  floorAreaM2  Int?
  floors       Int?
  rooms        Int?
  heatingType  String?
  boilerBrand  String?
  boilerModel  String?
  roofType     String?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("property_profiles")
}

model PlantProfile {
  itemId              String    @id
  commonName          String?
  botanicalName       String?
  variety             String?
  locationType        String?
  locationLabel       String?
  plantedDate         DateTime?
  sunRequirement      String?
  wateringFreqSummer  Int?
  wateringFreqWinter  Int?
  soilType            String?
  fertilizerType      String?
  fertilizerFreqWeeks Int?
  potSizeLiters       Int?
  hardyZone           Int?
  healthStatus        String?   @default("healthy")
  lastWateredAt       DateTime?
  lastFertilizedAt    DateTime?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("plant_profiles")
}

model Printer3dProfile {
  itemId            String   @id
  brand             String
  model             String
  buildVolumeX      Int?
  buildVolumeY      Int?
  buildVolumeZ      Int?
  nozzleDiameter    Decimal? @db.Decimal(3, 2)
  defaultNozzleMat  String?
  firmwareVersion   String?
  totalPrintHours   Decimal? @default(0) @db.Decimal(8, 2)
  totalPrints       Int?     @default(0)
  filamentConsumedG Int?     @default(0)

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("printer3d_profiles")
}

model PetProfile {
  itemId          String    @id
  petName         String
  species         String?
  breed           String?
  dateOfBirth     DateTime?
  gender          String?
  weightKg        Decimal?  @db.Decimal(5, 2)
  microchipNumber String?
  vetName         String?
  vetPhone        String?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("pet_profiles")
}

model BicycleProfile {
  itemId     String  @id
  type       String?
  brand      String?
  model      String?
  frameSize  String?
  groupset   String?
  brakeType  String?
  chainBrand String?
  chainKm    Int?    @default(0)
  totalKm    Int?    @default(0)

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@map("bicycle_profiles")
}

// ─── CUSTOM DOMAIN ───────────────────────────────────────────────────────────

model CustomDomain {
  id       String  @id @default(cuid())
  userId   String
  name     String
  icon     String?
  isPublic Boolean @default(false)

  user   User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  fields CustomDomainField[]
  items  CustomItemData[]

  @@index([userId])
  @@index([isPublic])
  @@map("custom_domains")
}

model CustomDomainField {
  id             String    @id @default(cuid())
  customDomainId String
  name           String
  key            String
  fieldType      FieldType
  unit           String?
  required       Boolean   @default(false)
  options        String[]
  order          Int       @default(0)

  customDomain CustomDomain @relation(fields: [customDomainId], references: [id], onDelete: Cascade)

  @@index([customDomainId])
  @@map("custom_domain_fields")
}

enum FieldType { TEXT NUMBER DATE BOOLEAN ENUM URL }

model CustomItemData {
  itemId         String @id
  customDomainId String
  data           Json

  customDomain CustomDomain @relation(fields: [customDomainId], references: [id])

  @@map("custom_item_data")
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────

model OnboardingState {
  userId          String    @id
  completedAt     DateTime?
  selectedHobbies String[]
  currentStep     String?
  stepData        Json?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("onboarding_states")
}

// ─── SHARING ─────────────────────────────────────────────────────────────────

model ShareExport {
  id        String   @id @default(cuid())
  userId    String
  itemId    String?           // nullozható: az export megmarad ha az Item törlődik
  content   String   @db.Text
  expiresAt DateTime?
  createdAt DateTime @default(now())

  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  item Item? @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("share_exports")
}

// ─── ÚJ DOMAIN PROFILOK ──────────────────────────────────────────────────────

model AquariumProfile {
  itemId         String   @id
  aquariumType   String   // freshwater | saltwater | reef | brackish | terrarium
  volumeLiters   Int?
  dimensions     String?
  setupDate      DateTime?
  substrate      String?
  lighting       String?
  filtration     String?
  co2System      Boolean  @default(false)
  heaterBrand    String?
  targetTempC    Decimal? @db.Decimal(4, 1)

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@map("aquarium_profiles")
}

model PoolProfile {
  itemId         String   @id
  poolType       String   // outdoor_pool | indoor_pool | hot_tub | jacuzzi
  volumeLiters   Int?
  filtrationKind String?
  pumpBrand      String?
  heaterType     String?
  targetTempC    Decimal? @db.Decimal(4, 1)
  saltSystem     Boolean  @default(false)
  uvSystem       Boolean  @default(false)

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@map("pool_profiles")
}

model BoatProfile {
  itemId              String   @id
  boatType            String   // sailboat | motorboat | kayak | canoe | jet_ski | rib
  make                String?
  model               String?
  year                Int?
  hullMaterial        String?
  lengthM             Decimal? @db.Decimal(5, 2)
  engineBrand         String?
  engineModel         String?
  engineHours         Decimal? @db.Decimal(8, 1)
  fuelType            String?
  fuelTankLiters      Int?
  mooringLocation     String?
  registrationExpires DateTime?
  insuranceExpires    DateTime?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@map("boat_profiles")
}

model DroneProfile {
  itemId              String   @id
  droneType           String   // drone | rc_car | rc_boat | rc_plane | fpv
  brand               String?
  model               String?
  serialNumber        String?
  totalFlightHours    Decimal? @db.Decimal(8, 2)
  totalFlights        Int?     @default(0)
  firmwareVersion     String?
  registrationNumber  String?
  registrationExpires DateTime?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@map("drone_profiles")
}

model InstrumentProfile {
  itemId        String  @id
  instrumentType String // guitar | bass | piano | violin | drums | wind | other
  brand         String?
  model         String?
  year          Int?
  serialNumber  String?
  material      String?
  stringGauge   String?  // "10-46" – húrosnál
  stringBrand   String?
  tuning        String?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@map("instrument_profiles")
}

model SolarProfile {
  itemId                  String   @id
  solarType               String   // rooftop | balcony | off_grid
  installer               String?
  installationDate        DateTime?
  panelCount              Int?
  panelWattPeak           Int?
  totalKwp                Decimal? @db.Decimal(6, 2)
  inverterBrand           String?
  inverterModel           String?
  batteryStorageKwh       Decimal? @db.Decimal(6, 2)
  annualYieldEstimateKwh  Int?
  monitoringUrl           String?

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  @@map("solar_profiles")
}
```

---

## CRON JOBS

### vercel.json – ütemezés

```json
{
  "crons": [
    { "path": "/api/cron/reminders",  "schedule": "0 6 * * *"    },
    { "path": "/api/cron/weather",    "schedule": "0 */6 * * *"  },
    { "path": "/api/cron/inventory",  "schedule": "0 7 * * *"    }
  ]
}
```

| Endpoint | Mikor fut | Mit csinál |
|----------|-----------|-----------|
| `/api/cron/reminders` | Minden reggel 6:00 | Date/interval/cron típusú reminderek kiértékelése, push küldés |
| `/api/cron/weather` | 6 óránként | Weather triggerek kiértékelése Open-Meteo alapján |
| `/api/cron/inventory` | Minden reggel 7:00 | Alacsony készlet detektálás, ShoppingList generálás |

**Fontos:** odometer-alapú reminderek NEM cron-ból triggerelnek – azokat a `VehicleService.updateOdometer()` értékeli ki közvetlenül.

---

### Reminder cron – implementáció

```typescript
// apps/web/src/app/api/cron/reminders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/server/db'
import { sendPushNotifications } from '@/server/domains/notification/push.service'
import { calculateNextTrigger } from '@/server/domains/reminder/reminder.utils'

export async function GET(req: NextRequest) {
  // Csak Vercel hívhatja – CRON_SECRET ellenőrzés
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getPrismaClient()
  const now = new Date()

  // Összes aktív, esedékes reminder lekérése (az @@index([isActive, nextTriggerAt]) itt fontos)
  const dueReminders = await db.reminder.findMany({
    where: {
      isActive: true,
      triggerType: { in: ['DATE', 'INTERVAL_DAYS', 'CRON'] },
      nextTriggerAt: { lte: now },
      snoozeUntil: { or: [{ equals: null }, { lt: now }] },
    },
    include: {
      item: { select: { name: true, userId: true } },
    },
  })

  // Csoportosítás user szerint (1 DB query a notification preference-ekhez)
  const userIds = [...new Set(dueReminders.map(r => r.item.userId))]
  const prefs = await db.notificationPreference.findMany({
    where: { userId: { in: userIds } },
  })
  const users = await db.user.findMany({
    where: { id: { in: userIds }, expoPushToken: { not: null } },
    select: { id: true, expoPushToken: true },
  })

  const prefMap = Object.fromEntries(prefs.map(p => [p.userId, p]))
  const tokenMap = Object.fromEntries(users.map(u => [u.id, u.expoPushToken!]))

  const notifications: PushMessage[] = []

  for (const reminder of dueReminders) {
    const userId = reminder.item.userId
    const pref = prefMap[userId]
    const token = tokenMap[userId]

    if (!token || !pref?.pushEnabled) continue

    // Csendes órák ellenőrzése (felhasználó timezone-jában)
    if (isInQuietHours(pref.quietHoursFrom, pref.quietHoursTo)) continue

    notifications.push({
      to: token,
      titleKey: 'notifications.reminder_due.title',
      bodyKey: 'notifications.reminder_due.body',
      bodyParams: { itemName: reminder.item.name, reminderTitle: reminder.title },
      actionUrl: `/items/${reminder.itemId}`,
    })

    // Következő trigger kiszámítása + mentés
    const nextTriggerAt = calculateNextTrigger(reminder.triggerType, reminder.triggerConfig)
    await db.reminder.update({
      where: { id: reminder.id },
      data: { lastTriggeredAt: now, nextTriggerAt },
    })

    // SmartNotification rekord létrehozása (előzmény)
    await db.smartNotification.create({
      data: {
        userId,
        reminderId: reminder.id,
        channel: 'push',
        titleKey: 'notifications.reminder_due.title',
        bodyKey: 'notifications.reminder_due.body',
        bodyParams: { itemName: reminder.item.name, reminderTitle: reminder.title },
        actionUrl: `/items/${reminder.itemId}`,
      },
    })
  }

  // Batch push küldés (Expo SDK max 100/batch)
  await sendPushNotifications(notifications)

  return NextResponse.json({ processed: dueReminders.length, sent: notifications.length })
}
```

### calculateNextTrigger – implementáció

```typescript
// server/domains/reminder/reminder.utils.ts
import { parseExpression } from 'cron-parser'   // npm: cron-parser

export function calculateNextTrigger(
  type: TriggerType,
  config: Json
): Date | null {
  const now = new Date()

  switch (type) {
    case 'DATE':
      return null   // egyszeri trigger – nincs következő

    case 'INTERVAL_DAYS': {
      const { days } = config as { days: number }
      return addDays(now, days)
    }

    case 'CRON': {
      const { expression } = config as { expression: string }
      const interval = parseExpression(expression, { currentDate: now })
      return interval.next().toDate()
    }

    case 'ODOMETER':
      return null   // nem dátum alapú – updateOdometer() értékeli ki

    case 'WEATHER':
      return null   // nem dátum alapú – weather cron értékeli ki

    case 'COMPOUND':
      return null   // komplex logika – weather cron kezeli

    default:
      return null
  }
}
```

### Push szöveg fordítása küldés előtt

```typescript
// A push notification lock screenen megjelenik → fordítani kell küldés előtt,
// nem i18n kulcsot küldeni. A user locale-ja alapján fordítjuk szerver oldalon.

import { getTranslations } from '@/packages/i18n/server'  // szerver oldali i18n

// A cron job-ban, reminder feldolgozáskor:
const t = getTranslations(user.locale)   // 'hu' vagy 'en'

notifications.push({
  to: token,
  title: t('notifications.reminder_due.title'),
  body: t('notifications.reminder_due.body', {
    itemName: reminder.item.name,
    reminderTitle: reminder.title,
  }),
  data: { actionUrl: `/items/${reminder.itemId}` },
})

// A SmartNotification rekordban viszont a kulcs marad (UI rendereléshez):
await db.smartNotification.create({
  data: {
    titleKey: 'notifications.reminder_due.title',
    bodyKey: 'notifications.reminder_due.body',
    bodyParams: { itemName: reminder.item.name, reminderTitle: reminder.title },
    ...
  }
})
```

### Email service (Resend)

```typescript
// server/domains/notification/email.service.ts
// Resend: 3000 email/hó ingyenes, Next.js natív integráció, React Email támogatás

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendReminderEmail(params: {
  to: string
  locale: string
  itemName: string
  reminderTitle: string
  actionUrl: string
}) {
  const t = getTranslations(params.locale)

  await resend.emails.send({
    from: 'Wrenchly <reminders@wrenchly.app>',
    to: params.to,
    subject: t('notifications.reminder_due.title'),
    html: renderReminderEmail(params),   // React Email template
    text: `${t('notifications.reminder_due.title')}: ${params.reminderTitle} – ${params.itemName}`,
  })
}
```

```bash
# Hozzáadni az env változókhoz:
RESEND_API_KEY="re_..."
```

### Push service (Expo Server SDK)

```typescript
// server/domains/notification/push.service.ts

import Expo, { type ExpoPushMessage } from 'expo-server-sdk'

const expo = new Expo()

interface PushMessage {
  to: string
  titleKey: string
  bodyKey: string
  bodyParams?: Record<string, string>
  actionUrl?: string
}

export async function sendPushNotifications(messages: PushMessage[]) {
  // Csak érvényes Expo token-ekre küldjük
  const valid = messages.filter(m => Expo.isExpoPushToken(m.to))

  const chunks = expo.chunkPushNotifications(
    valid.map(m => ({
      to: m.to,
      sound: 'default',
      // Push szöveg angolul megy – a mobilon az i18n csomag fordítja
      // (Expo push notification nem tudja a user locale-ját, ezért kulcsot küldünk)
      title: m.titleKey,
      body: m.bodyKey,
      data: { bodyParams: m.bodyParams, actionUrl: m.actionUrl },
    } satisfies ExpoPushMessage))
  )

  for (const chunk of chunks) {
    const receipts = await expo.sendPushNotificationsAsync(chunk)
    // Invalidált tokenek kezelése (DeviceNotRegistered hiba)
    for (const receipt of receipts) {
      if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
        // Token lejárt → törljük a User-ből
        await invalidatePushToken(receipt)
      }
    }
  }
}
```

---

## WEATHER TRIGGER

### Open-Meteo integráció (ingyenes, API kulcs nélkül)

```typescript
// server/domains/weather/weather.service.ts

interface DailyForecast {
  date: string
  tempMin: number
  tempMax: number
  precipitationMm: number
}

export class WeatherService {

  async getDailyForecast(lat: number, lon: number, days = 14): Promise<DailyForecast[]> {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', lat.toString())
    url.searchParams.set('longitude', lon.toString())
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum')
    url.searchParams.set('forecast_days', days.toString())
    url.searchParams.set('timezone', 'auto')

    const res = await fetch(url.toString(), { next: { revalidate: 21600 } }) // 6 óra cache
    const data = await res.json()

    return data.daily.time.map((date: string, i: number) => ({
      date,
      tempMin: data.daily.temperature_2m_min[i],
      tempMax: data.daily.temperature_2m_max[i],
      precipitationMm: data.daily.precipitation_sum[i],
    }))
  }

  evaluateCondition(
    condition: WeatherTriggerConfig,
    forecast: DailyForecast[]
  ): { triggered: boolean; reason: string } {

    switch (condition.condition) {

      case 'temp_above': {
        // X egymást követő napon át tempMin > threshold
        const recentDays = forecast.slice(0, condition.days ?? 7)
        const allAbove = recentDays.every(d => d.tempMin > condition.value)
        return {
          triggered: allAbove,
          reason: `Minimum hőmérséklet ${condition.days} napja ${condition.value}°C felett`
        }
      }

      case 'frost_warning': {
        // Következő 48 órában (2 nap) tempMin < 2°C
        const next2Days = forecast.slice(0, 2)
        const frostExpected = next2Days.some(d => d.tempMin < 2)
        return { triggered: frostExpected, reason: 'Fagyveszély a következő 48 órában' }
      }

      case 'no_rain_48h': {
        // Utolsó 2 napban nem esett
        const last2Days = forecast.slice(0, 2)
        const noRain = last2Days.every(d => d.precipitationMm < 1)
        return { triggered: noRain, reason: '48 óra alatt nem esett eső' }
      }

      case 'last_frost_passed': {
        // 14 napos előrejelzésben nincs fagyveszély
        const noFrostAhead = forecast.every(d => d.tempMin > 2)
        return { triggered: noFrostAhead, reason: 'Az utolsó fagy elmúlt' }
      }

      default:
        return { triggered: false, reason: 'Ismeretlen feltétel' }
    }
  }
}
```

### Weather cron endpoint

```typescript
// apps/web/src/app/api/cron/weather/route.ts

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getPrismaClient()
  const weatherService = new WeatherService()

  // Összes aktív weather trigger lekérése
  const weatherReminders = await db.reminder.findMany({
    where: { isActive: true, triggerType: 'WEATHER' },
    include: {
      item: { select: { userId: true, name: true } },
    },
  })

  // User koordináták betöltése (1 query)
  const userIds = [...new Set(weatherReminders.map(r => r.item.userId))]
  const usersWithLocation = await db.user.findMany({
    where: {
      id: { in: userIds },
      defaultLat: { not: null },
      defaultLon: { not: null },
    },
    select: { id: true, defaultLat: true, defaultLon: true, expoPushToken: true },
  })
  const locationMap = Object.fromEntries(
    usersWithLocation.map(u => [u.id, { lat: u.defaultLat!, lon: u.defaultLon! }])
  )

  let triggered = 0

  for (const reminder of weatherReminders) {
    const location = locationMap[reminder.item.userId]
    if (!location) continue   // nincs megadva helyszín – kihagyjuk

    const forecast = await weatherService.getDailyForecast(
      Number(location.lat),
      Number(location.lon)
    )
    const config = reminder.triggerConfig as WeatherTriggerConfig
    const { triggered: conditionMet } = weatherService.evaluateCondition(config, forecast)

    if (!conditionMet) continue

    // Már küldtük ma? (ne spameljük)
    const alreadySentToday = await db.smartNotification.findFirst({
      where: {
        reminderId: reminder.id,
        triggeredAt: { gte: startOfDay(new Date()) },
      },
    })
    if (alreadySentToday) continue

    // Push küldés + rekord mentés
    await sendPushNotifications([{ to: usersWithLocation.find(u => u.id === reminder.item.userId)!.expoPushToken!, ... }])
    triggered++
  }

  return NextResponse.json({ checked: weatherReminders.length, triggered })
}
```

### Helyszín megadása onboardingban

A weather trigger csak akkor működik, ha a felhasználónak van megadott koordinátája. Ezt az onboarding utolsó lépéseként kell bekérni:

```
Onboarding utolsó lépés:
  "Hol laksz? (időjárás alapú emlékeztetőkhöz)"
  [ Helyszín engedélyezése ] ← device GPS
  vagy
  [ Budapest, Magyarország ▼ ] ← kézi keresés
```

Ha nincs megadva helyszín, a weather triggerek inaktívak maradnak, és az app figyelmeztet:
> "Az időjárás-alapú emlékeztetőkhöz add meg a helyszínedet → Beállítások"

---

## FILE UPLOAD – SUPABASE STORAGE

Igen, a Supabase Storage tökéletesen alkalmas erre. Nincs szükség Cloudflare R2-re vagy S3-ra.

### Bucket struktúra

```
Supabase Storage buckets:
  photos/          ← karbantartási fotók, item borítóképek
    {userId}/
      items/
        {itemId}/cover.jpg
      records/
        {recordId}/photo_1.jpg
        {recordId}/photo_2.jpg
  exports/         ← PDF exportok (ideiglenes, 7 nap után törölve)
    {userId}/
      {shareId}.pdf
```

### Storage RLS policy-k

```sql
-- Saját fotókat feltölthet
CREATE POLICY "users_upload_own_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()
  );

-- Saját fotókat olvashatja
CREATE POLICY "users_read_own_photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()
  );

-- Saját fotókat törölheti
CREATE POLICY "users_delete_own_photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()
  );
```

### Upload flow (kliens oldali, szerver megkerülése)

A nagy fájlok nem mennek át a Next.js szerveren – a kliens közvetlenül tölt fel Supabase-be.

```typescript
// lib/storage/upload.ts

import { supabase } from '@/lib/supabase/client'

export async function uploadMaintenancePhoto(
  file: File,
  userId: string,
  recordId: string
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/records/${recordId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw new Error(`errors.upload.failed`)

  // Publikus URL generálása (signed URL ha privát bucket kell)
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadItemCover(file: File, userId: string, itemId: string) {
  const path = `${userId}/items/${itemId}/cover.${file.name.split('.').pop()}`
  // ... ugyanaz
}
```

### Mobil (Expo) upload

```typescript
// apps/mobile/src/lib/storage/upload.ts
// React Native FileSystem + Supabase Storage

import * as ImagePicker from 'expo-image-picker'
import { decode } from 'base64-arraybuffer'

export async function pickAndUploadPhoto(userId: string, recordId: string) {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.8,          // tömörítés feltöltés előtt
    base64: true,
  })

  if (result.canceled || !result.assets[0]) return null

  const asset = result.assets[0]
  const path = `${userId}/records/${recordId}/${Date.now()}.jpg`

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, decode(asset.base64!), {
      contentType: 'image/jpeg',
    })

  if (error) throw error

  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
}
```

### URL mentése az adatbázisba

Upload után a visszakapott `storageUrl`-t a `Photo` táblába mentjük tRPC mutation-nel:

```typescript
// A MaintenanceForm submit-jakor:
const url = await uploadMaintenancePhoto(file, userId, recordId)
await trpc.maintenance.addPhoto.mutate({ recordId, url, caption })
```

## tRPC CONTEXT – SUPABASE SESSION

### A probléma

A web (Next.js) és a mobil (Expo) különböző módon küld session adatot:
- **Web:** Supabase session cookie-ban van, automatikusan csatolódik a kéréshez
- **Mobil:** Nincs közös cookie domain – Bearer token kerül az `Authorization` headerbe

A tRPC context mindkét forrásból ki kell tudja olvasni a `userId`-t.

### Context létrehozása (kétféle auth forrás)

```typescript
// apps/web/src/server/trpc.ts

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { initTRPC, TRPCError } from '@trpc/server'
import { createServices } from './services'

export async function createTRPCContext() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  let userId: string | null = null

  // Mindig getUser()-t használunk, NEM getSession()-t!
  // getSession() csak a cookie-t olvassa ki validálás nélkül – manipulálható.
  // getUser() szerver-oldali JWT verifikációt végez a Supabase Auth API-n.

  // 1. Cookie alapú auth (web)
  const cookieToken = cookieStore.get('sb-access-token')?.value
  if (cookieToken) {
    const { data: { user } } = await supabase.auth.getUser(cookieToken)
    userId = user?.id ?? null
  }

  // 2. Bearer token alapú auth (mobil – Authorization header)
  if (!userId) {
    const authHeader = headerStore.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id ?? null
    }
  }

  return {
    userId,                      // null ha nem authentikált
    supabase,
    services: createServices(),  // dependency injection
  }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  // Backend error-ok i18n kulcsokat adnak vissza, nem szövegeket
  errorFormatter({ shape, error }) {
    return { ...shape, message: error.message }  // message = i18n kulcs
  }
})

export const createTRPCRouter  = t.router
export const publicProcedure   = t.procedure

// Protected: dob UNAUTHORIZED-ot ha nincs session
// + TypeScript szempontjából ctx.userId innentől string (nem null)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'errors.unauthorized' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})
```

### Services factory – dependency injection

```typescript
// apps/web/src/server/services.ts
// Egy kérésen belül egyszer példányosodik, mindig friss Prisma client-tel

import { getPrismaClient } from './db'
import { ItemRepository }        from './domains/item/item.repository'
import { MaintenanceRepository } from './domains/maintenance/maintenance.repository'
import { VehicleRepository }     from './domains/vehicle/vehicle.repository'
import { ReminderRepository }    from './domains/reminder/reminder.repository'
import { ItemService }           from './domains/item/item.service'
import { MaintenanceService }    from './domains/maintenance/maintenance.service'
import { VehicleService }        from './domains/vehicle/vehicle.service'
import { ReminderService }       from './domains/reminder/reminder.service'

export function createServices() {
  const db = getPrismaClient()

  // Réteg 1: Repository-k (csak DB hívások)
  const itemRepo        = new ItemRepository(db)
  const maintenanceRepo = new MaintenanceRepository(db)
  const vehicleRepo     = new VehicleRepository(db)
  const reminderRepo    = new ReminderRepository(db)

  // Réteg 2: Service-k (üzleti logika + repo függőségek)
  const reminderService    = new ReminderService(reminderRepo)
  const itemService        = new ItemService(itemRepo, reminderService)
  const vehicleService     = new VehicleService(vehicleRepo, itemRepo, reminderService)
  const maintenanceService = new MaintenanceService(maintenanceRepo, itemRepo, reminderService)

  return { item: itemService, maintenance: maintenanceService,
           vehicle: vehicleService, reminder: reminderService }
}
```

### Prisma client singleton

```typescript
// apps/web/src/server/db.ts
// Next.js dev módban HMR miatt új Prisma client születhet – singleton megakadályozza

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    })
  }
  return globalForPrisma.prisma
}
```

### Mobil tRPC kliens (Bearer token küldése)

```typescript
// apps/mobile/src/lib/trpc/client.ts

import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { supabase } from '../supabase/client'
import type { AppRouter } from '@wrenchly/types'   // megosztott csomag

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.EXPO_PUBLIC_API_URL}/api/trpc`,
      headers: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})
```

### Adatfolyam összefoglalás

```
Web böngésző            Supabase cookie → createTRPCContext → ctx.userId ✅
Mobil (Expo)            Bearer token header → getUser(token) → ctx.userId ✅
Nem authentikált kérés  userId = null → protectedProcedure dob UNAUTHORIZED ✅
Integrációs teszt       userId = testUser.id → közvetlenül injektálva ctx-be ✅
```

---

## ENVIRONMENT VÁLTOZÓK

### Fájlstruktúra

```
apps/web/
├── .env.local          ← helyi fejlesztés (gitignore-ban!)
├── .env.test           ← integrációs tesztek (gitignore-ban!)
└── .env.example        ← sablon, ez kerül git-be (értékek nélkül)

apps/mobile/
└── .env.local          ← mobil fejlesztés (gitignore-ban!)
```

### `.env.local` (web – helyi fejlesztés)

```bash
# ── Supabase ──────────────────────────────────────────────────────
# Connection pooler URL (Next.js runtime + Prisma queries)
DATABASE_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct URL (Prisma migrate, csak migration futtatáshoz)
DIRECT_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Publikus (frontend is látja, NEXT_PUBLIC_ prefix kötelező)
NEXT_PUBLIC_SUPABASE_URL="https://PROJECTREF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Szerver oldali (soha ne kerüljön frontend bundle-be!)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ── Rate Limiting (Upstash) ───────────────────────────────────────
UPSTASH_REDIS_REST_URL="https://XXX.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXxxx"

# ── Cron védelem ─────────────────────────────────────────────────
# Vercel Cron hívja ezzel a secrettel az API-t – kívülről nem hívható
CRON_SECRET="valami-hosszu-veletlenszeru-string"

# ── App ──────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### `.env.test` (web – integrációs tesztek)

```bash
# Külön Supabase project VAGY ugyanaz, de test schema
DATABASE_URL="postgresql://postgres.TESTREF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.TESTREF:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://TESTREF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Rate limiting teszt módban kikapcsolva
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### `.env.local` (mobile – Expo)

```bash
# Expo publikus változók: EXPO_PUBLIC_ prefix kötelező
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_SUPABASE_URL="https://PROJECTREF.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

### GitHub Secrets (CI/CD + production)

```
# Éles Supabase
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Test Supabase (integrációs tesztekhez)
TEST_DATABASE_URL
TEST_DIRECT_URL
TEST_SUPABASE_URL
TEST_SUPABASE_ANON_KEY
TEST_SUPABASE_SERVICE_ROLE_KEY

# Rate limiting
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Cron
CRON_SECRET

# Email (Resend)
RESEND_API_KEY

# Vercel deploy
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Expo / EAS build
EXPO_ACCESS_TOKEN
```

### Validáció induláskor (T3 Env)

```typescript
// apps/web/src/env.ts
// Induláskor hibát dob ha hiányzik egy kötelező változó

import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL:              z.string().url(),
    DIRECT_URL:                z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL:    z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN:  z.string().optional(),
    CRON_SECRET:               z.string().min(16),
    RESEND_API_KEY:            z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL:           z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL:                  process.env.DATABASE_URL,
    DIRECT_URL:                    process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL:        process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN:      process.env.UPSTASH_REDIS_REST_TOKEN,
    CRON_SECRET:                   process.env.CRON_SECRET,
    RESEND_API_KEY:                process.env.RESEND_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL,
  },
})
// Használat: import { env } from '@/env' – soha ne process.env direktben
```

---

## DB INDEXEK

### Teljesítmény kritikus lekérdezések

Az indexek a Prisma sémában `@@index([...])` direktívával kerülnek be,
amelyből Prisma migration generál SQL `CREATE INDEX` utasítást.

---

### 1. Dashboard betöltés – felhasználó összes aktív itemje

```sql
SELECT * FROM items
WHERE user_id = $1 AND status = 'ACTIVE'
ORDER BY created_at DESC
```
```prisma
@@index([userId, status])   -- már a sémában van
```
**Miért fontos:** Dashboard nyitásakor azonnal fut, nincs fallback.

---

### 2. Item idővonalja – egy item karbantartásai, legújabb elöl

```sql
SELECT * FROM maintenance_records
WHERE item_id = $1
ORDER BY performed_at DESC
```
```prisma
@@index([itemId, performedAt])   -- már a sémában van
```

---

### 3. Cron job – esedékes reminderek lekérdezése (KRITIKUS)

Ez fut le **minden reggel** és minden online állapot-visszatéréskor.

```sql
SELECT * FROM reminders
WHERE is_active = true
  AND next_trigger_at <= NOW() + INTERVAL '3 days'
ORDER BY next_trigger_at ASC
```
```prisma
// Jelenleg csak (userId, nextTriggerAt) van – ez NEM elég a cron job-hoz
// Hozzáadandó a Prisma sémához:
@@index([isActive, nextTriggerAt])
```
**Miért fontos:** Ez az egyetlen query ami az összes user adatán fut egyszerre.
Index nélkül full table scan lenne minden cron futáskor.

---

### 4. Értesítési dashboard – olvasatlan értesítések

```sql
SELECT * FROM smart_notifications
WHERE user_id = $1
  AND read_at IS NULL
ORDER BY triggered_at DESC
LIMIT 50
```
```prisma
// Jelenlegi: @@index([userId, readAt]) – hiányzik a triggered_at
// Cserélendő:
@@index([userId, readAt, triggeredAt])
```

---

### 5. Éves költség összesítés

```sql
SELECT SUM(cost_total) FROM maintenance_records
WHERE user_id = $1
  AND performed_at >= '2026-01-01'
  AND performed_at < '2027-01-01'
```
```prisma
@@index([userId, performedAt])   -- már a sémában van
```

---

### 6. Alacsony készlet automatikus ellenőrzés (ShoppingList generálás)

```sql
SELECT * FROM inventory_items
WHERE user_id = $1
  AND min_quantity IS NOT NULL
  AND quantity <= min_quantity
```
```prisma
// Jelenlegi: csak @@index([userId]) – hiányzik a min_quantity szűrés
// Hozzáadandó:
@@index([userId, minQuantity])
```

---

### 7. Community custom domének listája

```sql
SELECT * FROM custom_domains
WHERE is_public = true
ORDER BY created_at DESC
```
```prisma
@@index([isPublic])   -- már a sémában van
```

---

### Index stratégia összefoglalás

Minden index be van írva a Prisma sémába – migration automatikusan generálja a `CREATE INDEX` utasításokat.

| Tábla | Index | Mire való | Sémában |
|-------|-------|-----------|---------|
| `items` | `(userId, status)` | Dashboard betöltés | ✅ |
| `items` | `(userId, type)` | Domain szűrés | ✅ |
| `maintenance_records` | `(itemId, performedAt)` | Item idővonalja | ✅ |
| `maintenance_records` | `(userId, performedAt)` | Éves költség, cross-item keresés | ✅ |
| `reminders` | `(userId, nextTriggerAt)` | User reminder lista | ✅ |
| `reminders` | `(isActive, nextTriggerAt)` | **Cron job** – összes esedékes reminder | ✅ |
| `smart_notifications` | `(userId, readAt, triggeredAt)` | Notification dashboard | ✅ |
| `inventory_items` | `(userId, minQuantity)` | Low stock automatikus ellenőrzés | ✅ |
| `shopping_list_items` | `(userId, status)` | Shopping lista szűrés | ✅ |
| `custom_domains` | `(isPublic)` | Community browsing | ✅ |
| `photos` | `(itemId)` | Item fotói | ✅ |
| `photos` | `(maintenanceRecordId)` | Record fotói | ✅ |
| `parts` | `(maintenanceRecordId)` | Record alkatrészei | ✅ |
| `share_exports` | `(userId)` | User exportjai | ✅ |

**Megjegyzés – partial index Postgres-ben:**
Az `(isActive, nextTriggerAt)` compound index működik, de optimálisabb lenne egy partial index:
```sql
CREATE INDEX idx_reminders_cron ON reminders(next_trigger_at) WHERE is_active = true;
```
Prisma ezt nem támogatja `@@index`-szel – a `prisma/migrations/` mappában kézzel kell hozzáadni raw SQL migrationként, ha teljesítményprobléma jelentkezik. MVP-hez a compound index elegendő.
