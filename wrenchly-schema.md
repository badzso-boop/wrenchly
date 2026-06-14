# Wrenchly – Teljes termékterv: adatmodell, domain katalógus, tech stack

---

## TECH STACK ARCHITEKTÚRA

### Monorepo struktúra (Turborepo + pnpm)

```
wrenchly/
├── apps/
│   ├── web/              ← Next.js 15 (App Router) – böngésző + PWA
│   └── mobile/           ← Expo (React Native) – iOS + Android
├── packages/
│   ├── ui/               ← Megosztott komponensek (NativeWind – Tailwind RN-hez)
│   ├── types/            ← Közös TypeScript típusok (Item, MaintenanceRecord, stb.)
│   ├── api-client/       ← tRPC kliens – web + mobile ugyanazt hívja
│   └── schema/           ← Zod validációs sémák (megosztva)
├── turbo.json
└── pnpm-workspace.yaml
```

**Miért ez a struktúra?**
- A `types` és `schema` csomagok egyszer definiáltak, minden app felhasználja
- TypeScript fordítási hibát dob ha az API változik – még mielőtt runtime-ban törne
- Web és mobil 80-90%-ban ugyanazt a business logic-ot használja
- Turborepo cache-eli a build-eket → gyors CI

---

### Rétegek

| Réteg | Web | Mobile | Megosztott |
|-------|-----|--------|------------|
| UI framework | Next.js 15 + React 19 | Expo SDK 52 + React Native | – |
| Styling | Tailwind CSS | NativeWind v4 | design tokens |
| API kommunikáció | tRPC | tRPC | `@wrenchly/api-client` |
| State management | Zustand / React Query | Zustand / React Query | logika megosztva |
| Forms | React Hook Form + Zod | React Hook Form + Zod | séma megosztva |
| Navigation | Next.js App Router | Expo Router v3 | – |

---

### Backend

```
API:          Next.js Route Handlers + tRPC (type-safe end-to-end)
Adatbázis:    Supabase (Postgres) – már meglévő account
ORM:          Prisma (séma = single source of truth, Supabase-szel 100% kompatibilis)
Auth:         Supabase Auth (beépített – Google/Apple/email, külön szolgáltatás nem kell)
File storage: Supabase Storage (fotókhoz – beépített, külön tárhely nem kell)
Push notif:   Expo Push Notifications (iOS + Android egységesen)
Cron jobs:    Vercel Cron (reminder kiküldések, weather check)
Weather API:  Open-Meteo (ingyenes, nincs API kulcs limit)
```

---

### Hosting & DevOps

```
Web:          Vercel (Next.js natív, edge functions, cron)
Mobile:       EAS (Expo Application Services) – build + OTA update
DB + Auth + Storage: Supabase (egy platform, egy számla)
Monitoring:   Sentry (web + mobile egyszerre)
Analytics:    PostHog (open-source, self-hostolható)
```

---

### Miért nem Flutter / Swift / Kotlin?

React Native (Expo) + Next.js monorepo:
- **Egy nyelv** (TypeScript) mindenre
- **Megosztott üzleti logika** – reminder kalkuláció, trigger kiértékelés, validáció
- **EAS OTA update** – az App Store jóváhagyás megkerülése kisebb frissítéseknél
- **NativeWind** – Tailwind szintaxis mobilon is, egységes design rendszer

---

---

## Alapfilozófia

Minden entitás egy közös magból épül fel, domain-specifikus kiterjesztésekkel.
A három alapkérdés minden esetben ugyanaz:
1. **Mi az?** (Item leírása)
2. **Mi történt vele?** (Maintenance Record)
3. **Mikor tegyem legközelebb?** (Reminder / Trigger)

---

## CORE ENTITÁSOK (minden doménben közös)

### User
```
id
email
name
timezone
created_at
```

### Item (a central entitás – minden "dolog" amit nyilvántartasz)
```
id
user_id
name                  – "Ford Focus 2015", "Kert – paradicsom ágyás", "Bambu X1C"
type                  – ENUM: vehicle | property | plant | machine | tool | device | other
subtype               – "car" | "motorcycle" | "house" | "printer_3d" | "raised_bed" | ...
icon / emoji          – UI-hoz
description
location              – "garázs", "nappali", "erkély"
status                – active | archived | sold
purchase_date
purchase_price
serial_number         – opcionális (gépekhez, eszközökhöz)
warranty_expires_at
cover_photo_url
created_at
updated_at
```

### MaintenanceRecord (minden elvégzett munka naplója)
```
id
item_id
user_id
performed_at          – mikor történt
title                 – "Olajcsere", "Öntözés", "Nozzle csere"
description           – részletes szabad szöveg
category              – domain-specifikus kategória (ld. lent)
cost_total            – összköltség
cost_labor            – munkadíj (ha kültős csinálta)
is_diy                – boolean: te csináltad-e
time_spent_minutes    – mennyi ideig tartott
odometer_value        – járműveknél km-óra állás
notes
created_at
```

### Part (felhasznált alkatrész/anyag egy MaintenanceRecord-hoz)
```
id
maintenance_record_id
name                  – "Castrol Edge 5W-40"
category              – oil | filter | part | material | filament | seed | chemical | other
brand
part_number           – OEM vagy aftermarket cikkszám
quantity
unit                  – liter | db | gramm | kg | méter | csomag
unit_price
total_price
supplier              – "Obi", "Amazon", "Prusa Shop"
url                   – link ahol megvetted
notes                 – "OMV-ben kapható", "2. fiókban van belőle"
```

### Photo (bármilyen entitáshoz csatolható)
```
id
entity_type           – item | maintenance_record | reminder
entity_id
url
caption
taken_at
```

### Reminder (emlékeztető / ütemezett feladat)
```
id
item_id
user_id
title                 – "Olajcsere esedékes", "Paradicsomot öntözni"
description
trigger_type          – ENUM: date | interval_days | odometer | condition | cron | weather
trigger_config        – JSON (ld. lent részletesen)
last_triggered_at
next_trigger_at       – kiszámolt következő időpont
is_active
notify_channels       – ["push", "email"]
snooze_until
created_at
```

### Trigger Config (JSON struktúrák típusonként)
```json
// Időalapú (dátum)
{ "type": "date", "date": "2026-09-01" }

// Ismétlődő időköz
{ "type": "interval_days", "days": 180, "last_done_at": "2026-01-15" }

// Kilométer-alapú
{ "type": "odometer", "every_km": 10000, "last_done_at_km": 145000 }

// Cron (heti/havi/szezonális)
{ "type": "cron", "expression": "0 9 * * 1", "label": "Hétfőnként 9:00" }

// Időjárás-feltétel
{ "type": "weather", "condition": "temp_above", "value": 20, "days": 7,
  "label": "Ha 7 napja 20°C felett van kint" }

// Összetett feltétel
{ "type": "compound", "operator": "AND",
  "conditions": [
    { "type": "cron", "expression": "0 8 1 5 *" },
    { "type": "weather", "condition": "last_frost_passed" }
  ]
}
```

### ShoppingListItem
```
id
user_id
item_id               – mihez kell (opcionális)
maintenance_record_id – melyik munkából keletkezett (opcionális)
name                  – "M8 csavar 30mm", "PLA filament fekete 1kg"
quantity
unit
estimated_price
store_suggestion      – "Obi", "Amazon", "Prusa"
url
priority              – low | medium | high | urgent
status                – pending | bought | cancelled
notes
created_at
```

### InventoryItem (raktáron lévő anyagok)
```
id
user_id
name
category              – filament | oil | paint | hardware | chemical | seed | other
brand
spec                  – "5W-40", "PLA", "RAL 3020 piros"
quantity
unit
location              – "garázs, 2. polc", "tároló szekrény"
min_quantity          – ennyi alatt ShoppingList bejegyzés generálódik
cost_per_unit
expiry_date           – festéknél, olajoknál, vegyszereknek
purchase_date
notes
```

---

## DOMAIN-SPECIFIKUS KITERJESZTÉSEK

### 1. JÁRMŰVEK (VehicleProfile)

```
item_id               – FK → Item (subtype: car | motorcycle | bicycle | scooter | boat)
make                  – "Ford"
model                 – "Focus"
year                  – 2015
variant               – "1.6 TDCi 115LE"
vin                   – alvázszám
license_plate
color
fuel_type             – gasoline | diesel | electric | hybrid | lpg
engine_displacement   – 1600 (cm³)
power_kw              – 85
transmission          – manual | automatic | cvt
drive_type            – fwd | rwd | awd

// Folyadékok
oil_spec              – "5W-40 LL04" (gyári előírás)
coolant_type          – "G12+"
brake_fluid_type      – "DOT 4"
tire_size_front       – "205/55 R16"
tire_size_rear        – "205/55 R16"
recommended_tire_pressure_front  – 2.3 (bar)
recommended_tire_pressure_rear   – 2.5 (bar)

// Aktuális állapot
current_odometer      – 155420 (km) – manuálisan frissítve
last_odometer_update  – 2026-06-01
```

**Karbantartás kategóriák járműhöz:**
```
oil_change            – Olajcsere
oil_filter            – Olajszűrő
air_filter            – Légszűrő
cabin_filter          – Pollenszűrő
fuel_filter           – Üzemanyagszűrő
spark_plugs           – Gyújtógyertya
timing_belt           – Vezérszíj (KRITIKUS – naplózni kötelező km-t!)
timing_chain          – Vezérlánc
brake_pads_front      – Első fékbetét
brake_pads_rear       – Hátsó fékbetét
brake_discs           – Féktárcsák
brake_fluid           – Fékfolyadék csere
coolant               – Hűtőfolyadék csere
transmission_fluid    – Váltóolaj
battery               – Akkumulátor csere
tires                 – Gumi csere/forgatás
alignment             – Geometria beállítás
suspension            – Futómű
exhaust               – Kipufogó
ac_service            – Légkondicionáló töltés
windshield_wipers     – Ablaktörlő lapát
bodywork              – Karosszéria, festés
inspection            – Műszaki vizsga
insurance             – Biztosítás (reminder!)
```

**Jellemző reminder config járműhöz:**
```
Olajcsere:      minden 10 000 km VAGY 12 hónap (amelyik előbb)
Vezérszíj:      minden 120 000 km VAGY 6 év
Légszűrő:       minden 30 000 km
Pollenszűrő:    minden 15 000 km VAGY évente
Fékfolyadék:    minden 2 évben
Műszaki vizsga: évente (rögzített dátum)
Biztosítás:     évi 1x (rögzített dátum + 30 nappal előtte push)
Téli gumi:      cron: november 1. → "Téli gumi ideje"
Nyári gumi:     cron: április 1. → "Nyári gumi ideje"
```

---

### 2. INGATLAN / HÁZ (PropertyProfile)

```
item_id
type                  – house | apartment | garage | cabin
address
year_built
floor_area_m2
floors
rooms

// Rendszerek
heating_type          – gas | electric | heat_pump | district | wood
boiler_brand          – "Viessmann"
boiler_model          – "Vitodens 200"
boiler_install_year
last_boiler_service
water_heater_type     – combo | separate
roof_type             – tile | flat | metal
```

**Helyszínek (Room / Area) – Item alá beágyazva:**
```
Konyha, Fürdőszoba 1, Fürdőszoba 2, Hálószoba, Nappali,
Pince, Garázs, Kert, Terasz, Tető, Pince, Fűtési rendszer
```

**Karbantartás kategóriák házhoz:**
```
plumbing_faucet       – Csap csere/javítás
plumbing_toilet       – WC javítás (úszó, töltőszelep)
plumbing_pipe         – Csőszerelés
electrical_outlet     – Konnektor csere
electrical_switch     – Kapcsoló csere
electrical_circuit    – Biztosíték, kismegszakító
hvac_filter           – Légkezelő szűrő
hvac_service          – Bojler/kazán éves szerviz
hvac_radiator         – Radiátor légtelenítés (cron: október)
painting_wall         – Festés (fal, mennyezet)
painting_exterior     – Külső festés
flooring              – Padló javítás/csere
door_window           – Ajtó, ablak tömítés, zsanér
roofing               – Tető, ereszcsatorna
furniture_assembly    – Polc, bútor összeszerelés
pest_control          – Kártevő irtás
cleaning_deep         – Nagytakarítás
appliance_washer      – Mosógép karbantartás
appliance_dishwasher  – Mosogatógép
appliance_fridge      – Hűtő
garden_equipment      – Fűnyíró, sövényvágó szerviz
```

**Jellemző reminder config házhoz:**
```
Kazán szerviz:         cron: szeptember 1. (évente)
Radiátor légtelenítés: cron: október 15.
Ereszcsatorna tisztítás: cron: november 1. (őszi levelek után)
Füstérzékelő teszt:    cron: minden 3 hónap
Tűzoltó ellenőrzés:   cron: évente
Mélyhűtő leolvasztás: cron: 6 havonta
Bojler anód rúd csere: interval: 3 év
```

**Tool requirements (Szerszámszükséglet egy munkához):**
```
MaintenanceRecord-hoz lehet csatolni:
required_tools: ["Csőfogó 24mm", "Teflon szalag", "Víznívó"]
purchase_needed: [{ name: "Teflon szalag", store: "Obi", approx_price: 400 }]
```
→ Ez automatikusan ShoppingListItem bejegyzést generál.

---

### 3. KERT / NÖVÉNYEK (PlantProfile)

```
item_id               – subtype: vegetable | fruit | flower | tree | shrub | herb | succulent | houseplant
common_name           – "Paradicsom"
botanical_name        – "Solanum lycopersicum"
variety               – "Moneymaker"
location_type         – bed | pot | greenhouse | balcony | ground
location_label        – "Déli ágyás, 3. sor"
planted_date
germinated_date
expected_harvest_date

// Igények
sun_requirement       – full_sun | partial_shade | shade
watering_frequency_summer  – 2 (naponta hányszor)
watering_frequency_winter  – 7 (7 naponta egyszer)
soil_type             – "laza, humuszos"
fertilizer_type       – "paradicsom műtrágya"
fertilizer_frequency_weeks – 2
pot_size_liters       – 20
hardy_zone            – 8 (hidegtűrés)

// Jelenlegi állapot
current_height_cm
last_watered_at
last_fertilized_at
health_status         – healthy | needs_attention | sick | dormant
notes
```

**Karbantartás kategóriák növényekhez:**
```
watering              – Öntözés
fertilizing           – Trágyázás / tápoldat
pruning               – Metszés / csípés
repotting             – Átültetés
seed_starting         – Magvetés (beltérben)
transplanting         – Kiültetés (kültérbe)
pest_treatment        – Kártevő kezelés (levéltetű, atka)
disease_treatment     – Betegség kezelés (lisztharmat, stb)
harvesting            – Betakarítás
mulching              – Talajtakarás
support_staking       – Karóba kötözés
soil_amendment        – Talajjavítás
winterizing           – Téliesítés, betakarás
```

**Weather-triggered reminder példák:**
```json
// Paradicsom kiültetés
{
  "type": "weather",
  "condition": "min_temp_above",
  "value": 15,
  "days": 7,
  "title": "Paradicsom kiültetés esedékes!",
  "description": "7 napja 15°C felett van az éjszakai minimum – biztonságos kiültetni."
}

// Fagyveszély figyelmeztetés
{
  "type": "weather",
  "condition": "frost_warning",
  "title": "Fagyveszély! Takard be a melegkedvelő növényeket."
}

// Öntözési emlékeztető (szezonális)
{
  "type": "compound",
  "conditions": [
    { "type": "cron", "expression": "0 7 * * 1,4" },   // H és Cs reggel 7
    { "type": "weather", "condition": "no_rain_48h" }   // Ha 48 óra alatt nem esett
  ],
  "title": "Öntözés szükséges"
}
```

---

### 4. 3D NYOMTATÁS (PrinterProfile + FilamentInventory)

**PrinterProfile:**
```
item_id               – subtype: fdm_printer | resin_printer
brand                 – "Bambu Lab"
model                 – "X1 Carbon"
build_volume_x_mm     – 256
build_volume_y_mm     – 256
build_volume_z_mm     – 256
nozzle_diameter_mm    – 0.4
default_nozzle_material – brass | hardened_steel | ruby
firmware_version
total_print_hours     – 843 (kumulált)
total_prints          – 1205
filament_consumed_g   – 28450
purchase_date
```

**FilamentSpool (InventoryItem kiterjesztése):**
```
id
user_id
brand                 – "Prusament"
material              – PLA | PETG | ABS | ASA | TPU | Nylon | CF | resin
color_name            – "Galaxy Black"
color_hex             – "#1a1a1a"
diameter_mm           – 1.75
total_weight_g        – 1000
remaining_weight_g    – 340   ← nyomtatásonként csökkentett
spool_tare_g          – 210
purchase_date
opened_date
storage_location      – "Száraz doboz #2"
desiccant_changed_at
is_dry                – boolean
bed_temp_c            – 65
nozzle_temp_c         – 220
notes
```

**PrintJob (MaintenanceRecord speciális változata):**
```
maintenance_record_id
printer_item_id
filament_spool_id
print_name            – "Raspberry Pi tartó v3"
file_name             – "rpi_holder_v3.3mf"
print_duration_min    – 187
filament_used_g       – 42
result                – success | fail | partial | cancelled
failure_reason        – "layer_adhesion" | "warping" | "clog" | "power_cut" | other
failure_at_percent    – 67
layer_height_mm       – 0.2
infill_percent        – 15
support_used          – boolean
print_speed_mm_s      – 200
nozzle_temp_c         – 220
bed_temp_c            – 65
cost                  – kiszámolt (filament ár / súly * felhasznált g)
photos                – before / after
```

**Nyomtató karbantartás kategóriák:**
```
nozzle_change         – Nozzle csere (edzett acél, réz, ruby)
bed_calibration       – Tárgyasztal szintezés / kalibrálás
belt_tension          – Szíj feszesség ellenőrzés
ptfe_tube             – PTFE cső csere (hotendben, bowdenben)
lubrication           – Tengelyek és csapágyak kenése
firmware_update       – Firmware frissítés
extruder_cleaning     – Extruder tisztítás, csigaszabadítás
bed_surface           – Tárgyasztal felület csere (PEI lemez)
hotend_cleaning       – Cold pull, forró húzás
motor_check           – Motorok, csatlakozók ellenőrzés
enclosure_filter      – Szűrő csere (aktív szén, HEPA)
```

**Jellemző reminder config nyomtatóhoz:**
```
Nozzle csere (sárgaréz):    minden 300 nyomtatási óra
PTFE cső csere:             minden 6 hónap VAGY 500 óra
Kenés:                      minden 100 óra
Firmware update:            cron: havonta ellenőrzés
Desiccant csere:            cron: 3 havonta
Szíj ellenőrzés:            cron: 3 havonta
```

---

### 5. ELEKTRONIKA / MIKROELEKTRONIKA (ElectronicsProject + ComponentInventory)

**ElectronicsProject:**
```
id
user_id
name                  – "ESP32 időjárásállomás"
description
platform              – Arduino | ESP32 | ESP8266 | RaspberryPi | STM32 | other
status                – idea | in_progress | completed | on_hold | abandoned
github_url
schematic_url
started_at
completed_at
notes
```

**ComponentInventory (InventoryItem kiterjesztése):**
```
id
user_id
name                  – "Ellenállás 10kΩ"
type                  – resistor | capacitor | transistor | ic | sensor |
                        module | connector | cable | display | battery |
                        microcontroller | relay | switch | led | diode | other
value                 – "10k" | "100nF" | "NE555" | "DHT22"
package               – "0805" | "DIP-8" | "TO-92" | "through-hole"
quantity
location              – "Kék fiók, B3 rekesz"
unit_price
supplier              – "Hestore" | "TME" | "LCSC" | "AliExpress"
supplier_url
datasheet_url
project_id            – melyik projekthez vetted (opcionális)
notes
```

**ProjectBOM (Bill of Materials):**
```
id
project_id
component_inventory_id
quantity_used
notes
```

**Eszköz karbantartás (forrasztóállomás, oszcilloszkóp, stb.):**
```
Forrasztópáka hegy csere:   minden 40 óra forrasztás
Forrasztóón pótlás:         inventory tracking
Kalibrálás (mérőeszköz):    évente
```

---

### 6. SZERSZÁMOK (ToolProfile)

```
item_id               – subtype: power_tool | hand_tool | measuring | garden_tool
brand                 – "Makita"
model                 – "DHP484"
type                  – drill | jigsaw | circular_saw | sander | grinder |
                        screwdriver | wrench | hammer | level | multimeter | other
is_cordless           – boolean
voltage               – 18 (V)
purchase_date
purchase_price
warranty_expires
condition             – new | good | fair | needs_repair | broken
location              – "Garázs, szerszámos szekrény, 2. polc"
serial_number
```

**Szerszám karbantartás:**
```
blade_change          – Fűrészlap, fúró csere
battery_health        – Akksi kapacitás ellenőrzés
lubrication           – Kenés
calibration           – Kalibrálás (mértékek, szintek)
cleaning              – Tisztítás
repair                – Javítás
```

---

### 7. TÚRÁZÓ / OUTDOOR FELSZERELÉS (GearProfile)

```
item_id               – subtype: footwear | shelter | sleeping | pack | clothing | navigation | safety
brand                 – "Salomon"
model                 – "X Ultra 4 GTX"
type                  – boots | tent | sleeping_bag | backpack | jacket | headlamp | other
purchase_date
purchase_price
weight_g              – 920
size                  – "44"
material              – "Gore-Tex"
waterproof_rating_mm  – 20000
condition             – new | good | fair | worn | retired
total_km_used         – kiszámolt a TripLog-ból
```

**TripLog:**
```
id
user_id
name                  – "Mátra, Kékestető 2026-05"
date
distance_km           – 18
elevation_gain_m      – 650
duration_hours        – 6.5
terrain               – trail | mountain | urban | snow
weather               – "felhős, 12°C"
gear_used             – [item_id, item_id, ...]  ← ezek kapnak "használt" bejegyzést
notes
```

**Karbantartás kategóriák túrafelszereléshez:**
```
waterproofing         – Vízhatlanítás (Nikwax, Grangers)
seam_sealing          – Varratok lezárása (sátor)
washing               – Mosás (hálózsák, dzseki – hőfok, mosószer típus fontos!)
repair_patch          – Javítás (ragasztó, Tenacious Tape)
strap_replacement     – Heveder, csat csere
sole_repair           – Talp ragasztás/csere
lace_replacement      – Cipőfűző csere
sole_condition_check  – Talp állapot ellenőrzés
```

**Jellemző reminders:**
```
Cipő vízhatlanítás:    minden 200 km VAGY 6 hónap
Sátor szilikonozás:    évente
Hálózsák mosás:        évente (vagy 20 éjszaka után)
Fejlámpa elem/akksi:   inventory tracking
```

---

### 8. SZÁMÍTÓGÉP HARDVER (ComputerProfile)

```
item_id               – subtype: desktop | laptop | server | nas | sbc
name                  – "Fő gép"
os                    – "Windows 11" | "Ubuntu 24.04"
cpu                   – "AMD Ryzen 7 5800X"
gpu                   – "RTX 4070"
ram_gb                – 32
storage               – [{ type: "nvme", brand: "Samsung", model: "980 Pro", size_gb: 1000 }]
mobo                  – "ASUS ROG Strix B550-F"
psu_w                 – 750
case_form             – ATX | mATX | ITX
purchase_date
```

**Karbantartás kategóriák:**
```
dust_cleaning         – Porfúvás (comp, hűtők)
thermal_paste         – Hőpaszta csere (CPU, GPU)
driver_update         – Driver frissítés
os_update             – OS frissítés / reinstall
storage_health        – SSD/HDD health check (CrystalDiskInfo)
ram_test              – Memória teszt (MemTest)
ups_battery           – UPS akksi csere
cable_management      – Kábel rendezés
backup_check          – Biztonsági mentés ellenőrzés
```

**Jellemző reminders:**
```
Porfúvás:              cron: 6 havonta
Hőpaszta csere:        interval: 3 év
SSD health check:      cron: évente
Backup ellenőrzés:     cron: havonta
```

---

### 9. AKVÁRIUM (AquariumProfile)

```
item_id               – subtype: freshwater | saltwater | reef | brackish | terrarium
volume_liters         – 200
dimensions            – "100x50x40 cm"
setup_date
substrate_type        – "fekete homok" | "kavics" | "bare bottom"
lighting_type         – "T5 HO" | "LED" | "Metal halide"
filtration            – "Eheim 2217 + sump"
co2_system            – boolean
heater_brand
heater_target_temp_c  – 26
```

**Vízparaméter log (WaterTestLog – MaintenanceRecord kiterjesztése):**
```
test_date
ph                    – 7.2
ammonia_ppm           – 0
nitrite_ppm           – 0
nitrate_ppm           – 20
gh                    – 8 (dGH)
kh                    – 5 (dKH)
temperature_c         – 26.5
salinity_psg          – (sósviznél)
calcium_ppm           – (reefnél)
magnesium_ppm
alkalinity_dkh
phosphate_ppm
test_kit_brand        – "API", "Salifert"
```

**Akvárium lakók (AquariumInhabitant):**
```
name                  – "Neon tetra"
scientific_name       – "Paracheirodon innesi"
type                  – fish | invertebrate | coral | plant | snail
quantity
added_date
origin                – "Díszkobold Budapest"
notes
```

**Karbantartás kategóriák:**
```
water_change          – Vízcserét (hány %, dátum)
filter_clean          – Szűrő tisztítás (szivacs, bioközeg)
glass_clean           – Üveg tisztítás
substrate_vacuum      – Aljzat porszívózás
fertilizing           – Tápanyag adagolás (növényeknek)
co2_refill            – CO2 palack feltöltés
medication            – Gyógykezelés (betegség, szer, adag)
equipment_check       – Pumpa, fűtő, lámpa ellenőrzés
```

**Jellemző reminders:**
```
Vízcserét:             cron: hetente (pl. vasárnap)
Szűrő tisztítás:       interval: 4-6 hét
Vízparaméter mérés:    cron: hetente
CO2 palack:            inventory tracking (fogyás alapján)
```

---

### 10. MEDENCE / JACUZZI (PoolProfile)

```
item_id               – subtype: outdoor_pool | indoor_pool | hot_tub | jacuzzi
volume_liters         – 30000
type                  – above_ground | inground | inflatable
filtration_type       – sand | cartridge | DE
pump_brand            – "Hayward"
pump_model            – "Super Pump 1HP"
heater_type           – gas | electric | heat_pump | solar | none
target_temp_c         – 28
cover_type            – none | manual | automatic | solar
salt_system           – boolean (sóklorozó)
uv_system             – boolean
```

**Vízkémia log (PoolChemTestLog):**
```
test_date
free_chlorine_ppm     – 1.5 (ideál: 1-3)
combined_chlorine_ppm – 0.2
ph                    – 7.4 (ideál: 7.2-7.6)
alkalinity_ppm        – 110 (ideál: 80-120)
calcium_hardness_ppm  – 250
cyanuric_acid_ppm     – 50 (stabiliátor)
salt_ppm              – (sórendszernél)
temperature_c
test_method           – strip | liquid_kit | electronic
```

**Karbantartás kategóriák:**
```
chemical_balance      – Vegyszer beállítás (pH, klór, alkalinitás)
shock_treatment       – Sokk klórozás
filter_backwash       – Szűrő visszamosás
filter_cartridge      – Szűrőbetét csere
skimmer_clean         – Habszedő tisztítás
pump_check            – Pumpa ellenőrzés
cover_clean           – Takaróponyva tisztítás
winterizing           – Téliesítés
opening               – Szezon nyitás
algae_treatment       – Alga kezelés
```

**Jellemző reminders:**
```
Vízteszt:              cron: 2-3 naponta
Szűrő visszamosás:     cron: hetente
Sokk klórozás:         cron: 2 hetente VAGY hőhullám után
Téliesítés:            cron: október 15.
Szezon nyitás:         cron: május 1.
Szűrőbetét csere:      interval: 3 hónap
```

---

### 11. CSÓNAK / KISHAJÓ (BoatProfile)

```
item_id               – subtype: sailboat | motorboat | kayak | canoe | jet_ski | rib
make                  – "Bayliner"
model                 – "Element F18"
year                  – 2019
hull_material         – fiberglass | aluminum | wood | inflatable
length_m              – 5.5
engine_brand          – "Mercury"
engine_model          – "60 ELPT"
engine_hours          – 312
fuel_type             – gasoline | diesel | electric
fuel_tank_liters      – 75
trailer_plate
mooring_location      – "Velencei-tó, Marina"
insurance_expires
registration_expires
```

**Motor service karbantartás (óralapú, nem km!):**
```
Olajcsere (4T motor):   minden 100 üzemóra
Gyújtógyertya:          minden 200 üzemóra
Üzemanyagszűrő:         évente
Vízszivattyú (impeller): évente (szezon előtt!)
Anód csere:             évente (korrózióvédelem)
Fogasszíj:              gyártói előírás szerint
Téli leállítás:         cron: október (üzemanyagstabilizátor, konzerválás)
Vízre bocsátás:         cron: április
```

---

### 12. HÁZIÁLLAT (PetProfile)

```
item_id               – subtype: dog | cat | bird | rabbit | reptile | fish | other
name                  – "Bodri"
species               – "Labrador Retriever"
breed
date_of_birth
gender
weight_kg             – 28.5
microchip_number
insurance_provider
vet_name
vet_phone
```

**Egészségügyi napló (PetHealthLog – MaintenanceRecord kiterjesztése):**
```
event_type            – vaccination | deworming | flea_tick | vet_visit |
                        grooming | dental | weight_check | medication
vaccine_name          – "Vanguard Plus 5"
product_name          – "Frontline Spot On"
dose_mg
weight_at_time_kg
vet_name
next_due_at
```

**Jellemző reminders:**
```
Kullancs/bolha kezelés:  interval: 1-3 hónap (terméktől függ)
Féreghajtás:             interval: 3 hónap
Oltás:                   évente (veszettség, kombinált)
Éves szűrővizsgálat:     cron: születésnap hónapja
Kutyafogmosás:           cron: hetente
Szőrápolás (nyírás):     interval: 2-3 hónap (fajtától függ)
```

---

### 13. DRÓN / RC MODELL (DroneProfile)

```
item_id               – subtype: drone | rc_car | rc_boat | rc_plane | fpv
brand                 – "DJI"
model                 – "Mini 4 Pro"
serial_number
total_flight_hours    – 42.5
total_flights         – 186
battery_cycles        – [{ battery_id: "B1", cycles: 87 }]
firmware_version
registration_number   – (LÉGÜGYI regisztráció!)
registration_expires
```

**Repülési napló (FlightLog – MaintenanceRecord kiterjesztése):**
```
flight_date
location
duration_minutes
distance_km
max_altitude_m
battery_used_id
weather               – "szélcsendes, 18°C"
purpose               – photography | racing | training | survey
notes
```

**Karbantartás kategóriák:**
```
propeller_check       – Propeller ellenőrzés/csere (ütés után kötelező!)
motor_check           – Motor hang, fordulatszám
battery_health        – Akksi kapacitás mérés
gimbal_calibration    – Gimbal kalibrálás
compass_calibration   – Iránytű kalibrálás (helyszínváltáskor)
firmware_update       – Firmware frissítés
visual_inspection     – Keret, karok vizuális ellenőrzés
```

**Jellemző reminders:**
```
Légügyi regisztráció: évente megújítani
Akksi storage töltés: ha 3+ napig nem repülsz (LiPo safety)
Propeller ellenőrzés: minden 50 repülés
Firmware check:       cron: havonta
```

---

### 14. HANGSZER (InstrumentProfile)

```
item_id               – subtype: guitar | bass | piano | violin | drums | wind | other
brand                 – "Gibson"
model                 – "Les Paul Standard"
year                  – 2018
serial_number
material              – "mahagóni test, jávor fogólap"
string_gauge          – "10-46" (gitárnál)
string_brand          – "Ernie Ball Regular Slinky"
tuning                – "E standard" | "Drop D"
last_setup_at
```

**Karbantartás kategóriák:**
```
string_change         – Húrcsere (dátum, márka, gauge)
setup                 – Beállítás (nyak görbület, oktáv hangolás, akció)
fret_polish           – Bundpolitúr
neck_adjustment       – Truss rod állítás
tuner_check           – Hangoló kalibráció
cleaning              – Tisztítás, polírozás
humidifier_refill     – Párásítófeltöltés (akusztikus gitárnál KRITIKUS)
piano_tuning          – Zongorahangolás
piano_regulation      – Zongoraregulálás (5-10 évente)
```

**Jellemző reminders:**
```
Húrcsere:              interval: 3 hónap (aktív játéknál) / 6 hónap
Párásítás ellenőrzés:  cron: október-március (fűtési szezon)
Zongorahangolás:       cron: évente kétszer
Setup:                 évente (évszakváltáskor – páratartalom változás)
```

---

### 15. KERÉKPÁR (BicycleProfile – VehicleProfile aldomén)

```
item_id
type                  – road | mtb | gravel | city | ebike | bmx
brand                 – "Trek"
model                 – "Marlin 7"
frame_size
groupset              – "Shimano Deore XT"
brake_type            – disc_hydraulic | disc_mechanical | rim | coaster
chain_brand           – "KMC X11"
chain_km              – 2340 (aktuális lánc futott km)
total_km              – 8750
```

**Karbantartás kategóriák:**
```
chain_lube            – Lánc kenés (olaj típusa: dry/wet/wax)
chain_check           – Lánc nyúlás mérés (chain checker)
chain_replace         – Lánc csere (0.75% nyúlásnál)
cassette_replace      – Fogaskoszorú csere
cable_replace         – Bowden csere
brake_bleed           – Hidraulikus fék eresztés
tire_change           – Gumi csere
tire_pressure         – Légnyomás ellenőrzés
bearing_service       – Csapágy zsírozás (bb, headset, kerék)
derailleur_adjust     – Váltó beállítás
suspension_service    – Villa/lengéscsillapító szerviz
```

**Jellemző reminders:**
```
Lánc kenés:            minden 150-200 km (esős időben hamarabb)
Lánc nyúlás mérés:     minden 500 km
Lánc csere:            kb. 2000-3000 km (mérés dönti el)
Gumi nyomás:           cron: hetente
Villa szerviz:         évente (vagy 120 üzemóra)
```

---

### 16. NAPELEMES RENDSZER (SolarProfile)

```
item_id               – subtype: rooftop | balcony | off_grid
installer
installation_date
panel_count           – 12
panel_watt_peak       – 400 (Wp/panel)
total_kwp             – 4.8
inverter_brand        – "Fronius"
inverter_model        – "Symo 5.0"
battery_storage_kwh   – 10 (ha van)
annual_yield_estimate_kwh – 4500
monitoring_url        – SolarEdge / Fronius Solar.web link
```

**Termelési napló (EnergyLog):**
```
date
production_kwh        – napi termelés
grid_export_kwh
self_consumption_kwh
irradiance            – opcionális (ha van mérő)
```

**Karbantartás kategóriák:**
```
panel_cleaning        – Panel tisztítás
inverter_check        – Inverter log ellenőrzés
cable_inspection      – Kábel, csatlakozó ellenőrzés
battery_health        – Akksi kapacitás ellenőrzés
yield_comparison      – Éves termelés vs. előző év összehasonlítása
```

**Jellemző reminders:**
```
Panel tisztítás:       cron: tavasszal (és szárazság/vihar után)
Éves szerviz:          cron: évente
Termelés ellenőrzés:   cron: havonta (anomália detektálás)
```

---

### 17. VARRÓGÉP / HÍMZŐGÉP (SewingMachineProfile)

```
item_id
brand                 – "Janome"
model                 – "MC6650"
type                  – mechanical | electronic | serger | embroidery
purchase_date
total_hours_approx
```

**Karbantartás kategóriák:**
```
needle_change         – Tű csere (minden 8-10 óra varrás)
oil                   – Olajozás (mechanikus gépeknél)
bobbin_clean          – Vetélő/orsótok tisztítás
tension_check         – Fonalszabályozó ellenőrzés
service               – Éves szerviz (gépmester)
```

---

## DOMAIN KATALÓGUS ÖSSZEFOGLALÁS

| # | Domain | Subtype-ok | Kulcs differenciátor |
|---|--------|-----------|----------------------|
| 1 | Jármű | auto, motor, robogó, hajó | km-alapú reminder |
| 2 | Ház/Ingatlan | ház, lakás, garázs | szoba-bontás, szerszámszükséglet |
| 3 | Kert/Növény | zöldség, virág, fa, szobanövény | weather trigger |
| 4 | 3D Nyomtató | FDM, resin | spool gramm tracking |
| 5 | Elektronika | Arduino, ESP, RPi projekt | BOM + fiók-helyzet |
| 6 | Szerszámok | gépi, kézi, mérő | garancia, hely |
| 7 | Túrafelszerelés | cipő, sátor, hálózsák | km-alapú kopás |
| 8 | PC Hardver | desktop, laptop, NAS | hőpaszta, backup |
| 9 | Akvárium | édesvíz, tengervíz, reef | vízparaméter log |
| 10 | Medence/Jacuzzi | kültéri, beltéri, hot tub | vízkémia log |
| 11 | Csónak/Kishajó | motorcsónak, vitorlás, kaják | óra-alapú szerviz |
| 12 | Háziállat | kutya, macska, madár | oltás/féreghajtás |
| 13 | Drón/RC | drón, RC autó, FPV | légügyi regisztráció |
| 14 | Hangszer | gitár, zongora, hegedű | húrcsere, zongorahangolás |
| 15 | Kerékpár | MTB, road, ebike | lánc km-követés |
| 16 | Napelemes rendszer | tetős, erkélyes, off-grid | termelési napló |
| 17 | Varrógép | mechanikus, elektronikus | tű-csere tracking |

**MVP-be kerül (P0-P1):** 1, 2, 3, 8, 12, 15
**V2-be kerül (P2-P3):** 4, 5, 6, 7, 9, 10, 13
**V3-ba kerül (P4):** 11, 14, 16, 17

---

## KERESZT-DOMÉN FUNKCIÓK

### SmartNotification (Értesítési rendszer)
```
id
user_id
reminder_id
triggered_at
channel               – push | email | in_app
message
action_url            – deep link az appban
read_at
snoozed_until
```

### ActivityFeed (Főoldali hírfolyam)
```
Minden MaintenanceRecord → megjelenik az item timeline-ján
Minden közelgő Reminder → megjelenik a "This week" szekcióban
Inventory alacsony szint → ShoppingList bejegyzés generálódik
```

### Statistics (Item-szintű statisztikák)
```
Járműnél:
  - Éves karbantartási költség
  - Ft/km arány
  - Következő 3 esedékes feladat

3D nyomtatónál:
  - Nyomtatott órák idén
  - Sikeres/sikertelen arány
  - Felhasznált filament kg/Ft

Kert:
  - Hány növény aktív
  - Következő öntözés

Ház:
  - Éves karbantartási költség szobánként
```

---

## ADATFOLYAM ÖSSZEFOGLALÁS

```
User
 ├── Items (sok)
 │    ├── domain profile (1:1 kiterjesztés)
 │    ├── MaintenanceRecords (sok)
 │    │    └── Parts (sok)
 │    │    └── Photos (sok)
 │    ├── Reminders (sok)
 │    │    └── trigger_config (JSON)
 │    └── Photos (sok)
 ├── InventoryItems (sok)
 │    └── low_stock → ShoppingListItems
 └── ShoppingListItems (sok)
```

---

## MVP SCOPE JAVASLAT (mit csináljunk elsőnek)

| Prioritás | Mit | Miért |
|-----------|-----|-------|
| P0 | Item + MaintenanceRecord + Part | Ez a mag |
| P0 | Vehicle domain + Odometer reminder | Legerősebb use case |
| P1 | Home domain | Második legerősebb |
| P1 | Push reminder (date + interval) | Retention |
| P2 | ShoppingList generálás | "Wow" feature |
| P2 | Plant domain + Weather trigger | Differenciálás |
| P3 | 3D Print domain + FilamentSpool | Niche de hűséges audience |
| P3 | Electronics + ComponentInventory | Power user feature |
| P4 | Statistics / cost tracking | Retention long-term |
| P4 | PDF export (eladáshoz) | Konverzió segítő |
