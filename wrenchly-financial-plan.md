# Wrenchly — Részletes Pénzügyi és Projekt Terv

**Dátum:** 2026. június 14.  
**Alapító:** Norbert Ujj  
**Modell:** SaaS előfizetés, Paddle fizetési feldolgozó

---

## 1. Termékleírás és Piaci Pozícionálás

**Mi a Wrenchly?**  
Karbantartás-nyilvántartó SaaS alkalmazás hobbyistáknak és DIY-osoknak — nyomon követi az autókat, ház körüli dolgokat, kerti gépeket, 3D nyomtatókat, kerékpárokat, elektronikát és még 10+ kategóriát. Proaktív push/email értesítések, emlékeztetők, alkatrész-nyilvántartás.

**Egyedi értékajánlat:** Egyetlen app mindenfajta saját dologra — nem csak autóra (mint a Drivvo), nem csak házra (mint a HomeZada), hanem minden tulajdonodra.

---

## 2. Célközönség és Kor Szerinti Szegmentáció

### 2.1 Elsődleges Célcsoport

| Kor | Szegmens | Leírás | Fizetési hajlandóság |
|-----|----------|--------|---------------------|
| **25–34** | "Fiatal tulajdonos" | Első autó, első lakás/albérlet, 3D nyomtató, e-bike. Mobilbarát, app-natív. | Mérsékelt ($3–5/hó) |
| **35–49** | "Csúcs DIY hobbysta" | Ház tulajdonos, több autó, kerti gépek, szerszámok. Legtöbb dologgal rendelkeznek. | Magas ($5–10/hó) |
| **50–65** | "Rendszerető senior" | Idősebbek, de nagyon rendszeretők. Kevesebb dolog, de precízen szeretnék követni. | Alacsony-közepes ($3–5/hó) |

### 2.2 Felhasználói Profil (részletes)

**Legértékesebb szegmens: 35–49 éves férfi, háztulajdonos**
- Van: autó (1-2 db), ház/kert, fűnyíró, mosógép, bojler, kerékpár, esetleg motor
- Évi 2-3x elfelejti mikor volt utoljára olajcsere, szűrőcsere
- Fizetős megoldásra nyitott ha megspórol egy garázslátogatást ($150+ értékű)
- Heti 5-10 percet szánna az app-ra
- Platformpreferencia: iOS (iPhone) + desktop (laptopon böngésző)

**Másodlagos szegmens: 25–34 éves tech-hobbysta**
- Van: autó, 3D nyomtató, mechanikus billentyűzet, hi-fi, e-bike
- App-natív, próbál ingyenes megoldásokat (spreadsheet, Notion), de unalmas
- Konverziós pont: ha az app elég "okos" (AI javaslatok, időjárás-kapcsolt figyelmeztetések)
- Platformpreferencia: Android + mobil-first

**Harmadlagos: 50–65 éves "rendszerető"**
- Kisebb portfolió, de precíz: auto-szerviz könyv, bojler garanciák, ház dok.
- Inkább web mint mobil
- Alacsony churn (ha megszokta, nem váltja le)

### 2.3 Felhasználási Gyakoriság (várható)

| Esemény | Frekvencia |
|---------|-----------|
| App megnyitás | 2–4×/hét |
| Karbantartás rögzítése | 2–6×/hónap |
| Értesítésre kattintás | 1–3×/hét |
| Emlékeztető beállítása | 1–3×/negyedév |
| Új item hozzáadása | 1–2×/negyedév |

---

## 3. Árazás és Paddle Integráció

### 3.1 Tervezett Csomagok

| Csomag | Havi ár | Éves ár (20% kedv.) | Leírás |
|--------|---------|---------------------|--------|
| **Free** | $0 | — | Max 3 item, max 10 rekord, nincs push értesítés |
| **Personal** | $4.99/hó | $47.88/év ($3.99/hó) | Korlátlan item, emlékeztetők, push + email |
| **Family** | $8.99/hó | $86.28/év ($7.19/hó) | 5 felhasználó megosztva, minden Personal funkció |

### 3.2 Paddle Díjak és Nettó Bevétel

Paddle Merchant of Record (MoR) modellben működik — ő a jogi eladó, nem te. Ez azt jelenti:
- Wrenchly **nem kell EU VAT-ot regisztráljon** különböző országokban
- Paddle kezeli az **összes ÁFAt** (EU, US sales tax, AU GST)
- Neked csak a nettó kerül kifizetésre Paddle által

**Effektív take-rate:**
- Personal havi ($4.99) → Paddle elvesz ~$0.75 (15%) → neked marad: **~$4.24/hó**
- Personal éves ($47.88) → Paddle elvesz ~$2.90 (6%) → neked marad: **~$44.98/év** (~$3.75/hó)

---

## 4. Infrastruktúra Költségek (Kiadások)

### 4.1 Fix Havi Kiadások

| Szolgáltatás | Szint | Havi Díj | Megjegyzés |
|-------------|-------|-----------|-----------|
| **Vercel** | Pro | $20 | Edge Functions, Analytics, 1TB sávszélesség |
| **Supabase** | Pro | $25 | 8GB DB, 100GB tárhely, 5M row reads/hó |
| **Upstash Redis** | Pay-as-you-go | $0–10 | Rate limiting, ~1M request/hó-ig ingyen |
| **Resend** | Pro | $20 | 50,000 email/hó |
| **EAS (Expo)** | Production | $29 | OTA updates, build pipeline |
| **GitHub** | Free/Team | $0–4 | Actions minutes |
| **Sentry** | Team | $26 | Error tracking, performance monitoring |
| **Domén** | — | ~$1.5 | wrenchly.app |
| **ÖSSZESEN** | | **~$121–135/hó** | |

### 4.2 Változó Kiadások (skálázódik userrel)

| Trigger | Küszöb | Plusz Díj |
|---------|--------|-----------|
| Supabase DB | 8GB+ | +$0.125/GB/hó |
| Resend email | 50k+/hó | +$0.40/1000 email |
| Vercel bandwidth | 1TB+/hó | +$0.15/GB |
| EAS builds | 500+/hó | $0.06/build |

---

## 5. Konverziós Feltételezések

| Metrika | Érték | Indok |
|---------|-------|-------|
| Free → Personal konverzió | 4–8% | SaaS benchmark: 2–10%, mi célzott niche |
| Personal → Family upgrade | 8–12% | Hobbysta közösségben terjedhet |
| Éves vs. havi split | 30–40% éves | Árengedmény vonzó |
| Havi churn (Personal) | 3–5% | Niche SaaS átlag |
| Havi churn (Family) | 1.5–2.5% | Hosszabb elkötelezettség |
| Organikus vs. fizetett növekedés | 70–30% | Kezdetben szinte csak organikus |

---

## 6. Három Pénzügyi Szcenárió

> **Közös feltételezések:** Indulás 2026. szeptember 1. · $0 fizetett hirdetés induláskor · Norbert egyedül fejleszt

---

### Szcenárió A — Pesszimista ("Slow Burn")

**Feltételezés:** Lassú organikus növekedés, magas churn, alacsony konverzió. Havi új regisztráció: 50–200.

#### Felhasználói Növekedés

| Időpont | Új Free User/hó | Kumulatív Free | Personal | Family | Fizető |
|---------|----------------|----------------|---------|--------|--------|
| 2026 Szept. | 50 | 50 | 2 | 0 | 2 |
| 2026 Dec. | 80 | 243 | 10 | 1 | 11 |
| 2027 Jún. | 120 | 730 | 30 | 5 | 35 |
| 2027 Dec. | 150 | 1,200 | 50 | 8 | 58 |
| 2028 Jún. | 170 | 1,900 | 78 | 12 | 90 |
| 2028 Dec. | 200 | 2,600 | 105 | 17 | 122 |

#### Bevétel és Profit

| Időpont | Nettó MRR | Fix Kiadás | Havi Eredmény | Kumulatív |
|---------|----------|-----------|--------------|-----------|
| 2026 Dec. | $50 | $127 | **-$77** | -$460 |
| 2027 Jún. | $165 | $127 | **+$38** | -$200 |
| 2027 Dec. | $273 | $132 | **+$141** | +$390 |
| 2028 Jún. | $423 | $138 | **+$285** | +$2,100 |
| 2028 Dec. | $576 | $140 | **+$436** | +$3,800 |

> **Break-even: 2027. május–június · ARR 2028 végén: ~$6,900**

---

### Szcenárió B — Átlagos ("Steady Growth")

**Feltételezés:** Normál SaaS növekedés. Sikeres Product Hunt launch (top 5 of the day), néhány hobbyista Reddit/Facebook poszt, 2-3 YouTube creator megemlíti. Havi új regisztráció: 200–900.

#### Felhasználói Növekedés

| Időpont | Új Free User/hó | Kumulatív Free | Personal | Family | Fizető |
|---------|----------------|----------------|---------|--------|--------|
| 2026 Szept. | 200 | 200 | 8 | 1 | 9 |
| 2026 Dec. | 350 | 1,062 | 45 | 6 | 51 |
| 2027 Jún. | 600 | 3,500 | 155 | 23 | 178 |
| 2027 Dec. | 700 | 5,600 | 250 | 38 | 288 |
| 2028 Jún. | 800 | 8,200 | 370 | 56 | 426 |
| 2028 Dec. | 900 | 11,000 | 500 | 75 | 575 |

#### Bevétel és Profit

| Időpont | Nettó MRR | Fix Kiadás | Havi Eredmény | Kumulatív |
|---------|----------|-----------|--------------|-----------|
| 2026 Szept. | $38 | $125 | **-$87** | -$87 |
| 2026 Nov. | $162 | $127 | **+$35** | -$0 |
| 2026 Dec. | $237 | $127 | **+$110** | +$110 |
| 2027 Jún. | $833 | $132 | **+$701** | +$3,700 |
| 2027 Dec. | $1,351 | $140 | **+$1,211** | +$11,000 |
| 2028 Jún. | $1,997 | $155 | **+$1,842** | +$25,000 |
| 2028 Dec. | $2,694 | $165 | **+$2,529** | +$43,000 |

> **Break-even: 2026. november (3. hónap) · ARR 2028 végén: ~$32,300**

---

### Szcenárió C — Optimista ("Viral Niche")

**Feltételezés:** Product Hunt #1 Product of the Day, nagy hobbista YouTube creator organikusan megemlíti (ChrisFix, Project Farm stílus), r/DIY és r/Cartalk viral poszt. Havi új regisztráció: 1,000–5,000+.

#### Felhasználói Növekedés

| Időpont | Új Free User/hó | Kumulatív Free | Personal | Family | Fizető |
|---------|----------------|----------------|---------|--------|--------|
| 2026 Szept. (launch spike) | 2,000 | 2,000 | 80 | 10 | 90 |
| 2026 Dec. | 1,000 | 5,512 | 240 | 30 | 270 |
| 2027 Jún. | 2,000 | 13,000 | 600 | 80 | 680 |
| 2027 Dec. | 2,500 | 20,000 | 920 | 125 | 1,045 |
| 2028 Jún. | 3,000 | 29,000 | 1,350 | 185 | 1,535 |
| 2028 Dec. | 3,500 | 40,000 | 1,900 | 260 | 2,160 |

#### Bevétel és Profit

| Időpont | Nettó MRR | Fix Kiadás | Havi Eredmény | Kumulatív |
|---------|----------|-----------|--------------|-----------|
| 2026 Okt. | $730 | $130 | **+$600** | +$700 |
| 2026 Dec. | $1,247 | $135 | **+$1,112** | +$2,900 |
| 2027 Jún. | $3,156 | $155 | **+$3,001** | +$22,000 |
| 2027 Dec. | $4,858 | $190 | **+$4,668** | +$57,000 |
| 2028 Jún. | $7,140 | $250 | **+$6,890** | +$110,000 |
| 2028 Dec. | $10,046 | $320 | **+$9,726** | +$185,000 |

> **Break-even: 2026. október (2. hónap) · ARR 2028 végén: ~$120,500**

---

## 7. Összefoglaló — 2028 December

| Metrika | Pesszimista | Átlagos | Optimista |
|---------|------------|---------|-----------|
| Fizető userek | 122 | 575 | 2,160 |
| Havi nettó MRR | $576 | $2,694 | $10,046 |
| Éves bevétel (ARR) | $6,900 | $32,300 | $120,500 |
| Havi profit | $436 | $2,529 | $9,726 |
| Kumulatív nyereség | $3,800 | $43,000 | $185,000 |
| Break-even | 2027. máj. | 2026. nov. | 2026. okt. |

---

## 8. Növekedési Stratégia

### Pre-Launch (2026. jún.–aug.)
- [ ] Landing page élőbe állítása (waitlist) — Cél: 500 email cím
- [ ] Reddit jelenlét: r/DIY, r/Cartalk, r/3Dprinting, r/homeimprovement — organikus részvétel
- [ ] Facebook Groups: DIY hobbyista csoportok (HU és EN)
- [ ] Product Hunt "Coming Soon" oldal aktiválása
- [ ] Béta tesztelők toborzása: 20-50 ember, ingyenes hozzáférés cserébe feedbackért

### Launch (2026. szeptember)
- [ ] Product Hunt launch — kedd reggel 12:01 AM PT (legjobb nap/időpont)
- [ ] Hacker News "Show HN" poszt
- [ ] Reddit launch postok hobbyista subredditeken
- [ ] YouTube Shorts / TikTok: 30 mp-es "before/after" demo
- [ ] Email a teljes waitlist-nek

### Post-Launch Növekedés

**Organikus ($0 költség):**
- SEO blog: "How to track car maintenance", "oil change reminder app", "home maintenance checklist"
- Automatikus poszt minden mérföldkőnél ($1 MRR, 100 user, stb.)
- User testimoniálók gyűjtése → landing page

**Fizetett hirdetés ($200–500/hó breakeven után):**
- Google Ads: "car maintenance tracker", "home maintenance app"
- Facebook/Instagram: 35-50 éves férfi, háztulajdonos, DIY érdeklődés

**Partner/Affiliate:**
- Autóalkatrész YouTube csatornák → affiliate link
- DIY podcast sponsorship (skálával jön)

---

## 9. Jogi és Operatív Kérdések

### Cégstruktúra
- Ajánlott: Magyar egyéni vállalkozó (EV) induláskor → ha skálázódik, Kft.
- Paddle mint MoR kezeli a külföldi ÁFát → te csak a magyar áfával foglalkozol
- Paddle kifizetés: havi, minimálisan $25 egyenleg felett

### GDPR
- Supabase EU adatközpontban (Frankfurt) → GDPR-compliant alapból
- Privacy Policy + Terms of Service szükséges launch előtt (iubenda.com ~$27/év)
- Cookie consent banner ha tracking/analytics van

### App Store
- Apple Developer Program: $99/év
- Google Play egyszeri regisztráció: $25
- App Store review idő: 1-7 nap (Apple), néhány óra (Google)

---

## 10. Részletes Projekt Roadmap

### Fázis 0 — Infrastruktúra Konfigurálás (2026. jún.)
- [ ] Supabase project létrehozása, `.env.local` konfigurálás
- [ ] Vercel deploy pipeline beállítása
- [ ] Resend + Upstash Redis beállítás
- [ ] Prisma migrate a produkciós DB-re
- [ ] Expo EAS build konfigurálás

### Fázis 1 — MVP Finomítás (2026. júl.)
- [ ] Paddle integráció (webhook + subscription kezelés)
- [ ] Free tier limit enforcelés (3 item, 10 rekord)
- [ ] Landing page elkészítése (waitlist)
- [ ] Onboarding flow (üdvözlő email, első item hozzáadás wizard)
- [ ] Mobil app App Store-ba feltöltés

### Fázis 2 — Launch (2026. aug.–szept.)
- [ ] Béta program 50 emberrel
- [ ] Feedback alapján bugfixek és UX javítások
- [ ] Product Hunt launch
- [ ] SEO blog első 5 cikke

### Fázis 3 — Növekedés (2026. okt.–2027. márc.)
- [ ] AI funkciók: "Mi a következő várható karbantartás?" (OpenAI API)
- [ ] Import funkció (CSV, OBD2 adatok)
- [ ] Family tier aktiválás és megosztás
- [ ] Dashboard analytics
- [ ] iOS/Android Widget — gyors rögzítés

### Fázis 4 — Skálázódás (2027+)
- [ ] API integráció (autóalkatrész partnerek, garancia adatbázisok)
- [ ] Marketplace: ajánlott szervizek, affiliate bevétel
- [ ] Team/Business tier (flottakezelés kis vállalkozásoknak)
- [ ] Többnyelvűség (HU, DE, PL, CZ — közép-kelet-európai piac)

---

## 11. Konkurencia Elemzés

### 11.1 Közvetlen Versenytársak

#### Drivvo (drivvo.com)
- **Fókusz:** Kizárólag autó/jármű karbantartás
- **Platform:** iOS + Android (mobil-only)
- **Árazás:** Freemium, ~$2.99/hó vagy $14.99/év
- **Erősségek:** Nagyon polírozott UX autóra, OBD2 integráció, nagy felhasználói bázis (~5M letöltés)
- **Gyengeségek:** Csak járművekre használható, nincs web app, nincs ház/kert/egyéb kategória, nincs email értesítés

#### AUTOsist (autosist.com)
- **Fókusz:** Autó + kis mértékben fleet management
- **Platform:** iOS + Android + Web
- **Árazás:** $3.99/hó / $39.99/év
- **Erősségek:** Web app megvan, reminders, expense tracking
- **Gyengeségek:** Csak autóra, B2B felé tolódik (fleet), UX elavult, nincs push notification

#### HomeZada (homezada.com)
- **Fókusz:** Ház karbantartás és dokumentáció
- **Platform:** Web + iOS + Android
- **Árazás:** $9.99/hó (drága!) vagy $99/év
- **Erősségek:** Nagyon részletes ház-specifikus funkciók (garancia, biztosítás, dokumentumok)
- **Gyengeségek:** Drága, csak házra fókuszál, nem intuitív UX, nincs kert/autó integráció

#### Notion / Spreadsheet (indirekt versenytárs)
- **Fókusz:** Általános produktivitás
- **Platform:** Mindenhol
- **Árazás:** $0–10/hó
- **Erősségek:** Ingyenes, flexibilis, ismerős
- **Gyengeségek:** Nincs automatikus emlékeztető, nincs okostelefon widget, manuális minden, nincs mobil push notification, nem karbantartás-specifikus

#### GaragePro / MyCarfax (autós niche)
- **Fókusz:** Szervizkönyv / autó history
- **Platform:** Elsősorban dealer/workshop B2B
- **Árazás:** $5–15/hó
- **Erősségek:** VIN lookup, szerviz história
- **Gyengeségek:** B2B orientált, nem DIY-os, nincs multi-category

---

### 11.2 Wrenchly vs. Konkurencia — Összehasonlító Táblázat

| Funkció | **Wrenchly** | Drivvo | AUTOsist | HomeZada | Notion |
|---------|:-----------:|:------:|:--------:|:--------:|:------:|
| Autó tracking | ✅ | ✅ | ✅ | ❌ | Manual |
| Ház tracking | ✅ | ❌ | ❌ | ✅ | Manual |
| Kert/gépek | ✅ | ❌ | ❌ | ❌ | Manual |
| 3D nyomtató | ✅ | ❌ | ❌ | ❌ | Manual |
| Kerékpár/motor | ✅ | Részben | ❌ | ❌ | Manual |
| Push értesítés | ✅ | ✅ | ❌ | ❌ | ❌ |
| Email értesítés | ✅ | ❌ | Részben | ✅ | ❌ |
| Web app | ✅ | ❌ | ✅ | ✅ | ✅ |
| Mobil app | ✅ | ✅ | ✅ | ✅ | ✅ |
| Időjárás-alapú | ✅ | ❌ | ❌ | ❌ | ❌ |
| Family sharing | ✅ | ❌ | ❌ | ✅ | ✅ |
| Alkatrész log | ✅ | ✅ | Részben | ❌ | Manual |
| Ár (havi) | $4.99 | $2.99 | $3.99 | $9.99 | $0–10 |

---

### 11.3 Wrenchly Előnyei a Konkurenciával Szemben

#### 1. Multi-Category — Az egyetlen "mindent egybe" megoldás
**Részletezés:** Egyetlen felhasználónak általában van autója, háza, kerékpárja, esetleg 3D nyomtatója. Ma ehhez 3-4 különböző app kellene (Drivvo + HomeZada + valami más). A Wrenchly az **egyetlen** app ami mindet lefedi egyetlen előfizetésért.

**Üzleti hatás:** Magasabb percepcionált érték ($4.99 egy app vs. $2.99 + $9.99 + manual = $13+). A váltási költség is magasabb lesz idővel.

#### 2. Időjárás-Kapcsolt Emlékeztetők (egyedi!)
**Részletezés:** Nyílt Open-Meteo API integrációval a Wrenchly tud időjárás-alapú figyelmeztetéseket küldeni — pl. "Holnap fagy várható, ajánlott a téli gumiváltás" vagy "Szezonális gépnyíró szerviz: a héten jó idő lesz." Ezt **egy versenytárs sem csinálja**.

**Üzleti hatás:** Differenciáló funkció ami virálisan terjed ("wow, erre nem is gondoltam") — erős Word of Mouth hajtóerő.

#### 3. Web + Mobil Paritás (a Drivvo-val szemben)
**Részletezés:** A Drivvo piacvezető, de csak mobil. Sok felhasználó szeretne asztali gépen is karbantartási rekordot hozzáadni (főleg szerviz után, amikor laptopon van). A Wrenchly-nek teljes Next.js web appja van.

#### 4. Modern Tech Stack = Gyorsabb Fejlesztés
**Részletezés:** Next.js 15, tRPC, Prisma, Supabase — ezzel a stackkel új funkciók heteken belül kiszállíthatók. A HomeZada pl. elavult tech-en fut, nehézkes UI-val.

#### 5. EU/GDPR Natív (Supabase Frankfurt)
**Részletezés:** Az EU-s piacra belépve (HU, DE, PL) a GDPR compliance alapból megvan. A legtöbb US-alapú versenytárs erre külön erőfeszítést tesz (vagy nem tesz).

#### 6. Ár-Érték Arány a HomeZada-val Szemben
**Részletezés:** HomeZada $9.99/hó csak házkarbantartásra. Wrenchly $4.99/hó mindenre. A HomeZada userek aktívan keresnek alternatívát az árazás miatt (lásd: Reddit r/homeimprovement kommentek).

---

### 11.4 Wrenchly Hátrányai és Kihívásai

#### 1. Nincs OBD2 Integráció (egyelőre)
**Részletezés:** A Drivvo tud csatlakozni OBD2 adapterhez és automatikusan beolvasni a km-állást. A Wrenchly-ben ezt manuálisan kell beírni.  
**Kockázat:** Az "autó-power user" szegmens ezt hiányolhatja.  
**Mitigálás:** OBD2 integráció a Fázis 3-4 roadmapban van. Egyelőre a "nem csak autós" pozícionálással áthidalható.

#### 2. Kisebb Felhasználói Bázis = Kevesebb Social Proof
**Részletezés:** Drivvo-nak 5M+ letöltése van, ez hatalmas bizalom-jel az App Store-ban. Egy új app nulláról indul.  
**Mitigálás:** Korai béta tesztelők véleményei, Product Hunt szavazatok, IndieHackers milestone posztok.

#### 3. Solo Founder Kapacitás
**Részletezés:** Norbert egyedül fejleszt és marketingez. Ha egyszerre jön sok user/bug/feature request, szűk keresztmetszetté válik.  
**Mitigálás:** Jól dokumentált kódbázis, automatizált CI/CD, erős community support. Első freelancer felvétele ha MRR eléri a $1,000-t.

#### 4. Tudatosság Hiánya ("Multi-category" fogalom nem létezik még)
**Részletezés:** A users nem keresnek "multi-category maintenance tracker"-t, mert nem tudják, hogy létezik. A "car maintenance app"-ot keresik, vagy "home maintenance app"-ot — ez két külön célcsoport.  
**Mitigálás:** Két párhuzamos SEO/content stratégia: egyik az autós usereket célozza ("the last car maintenance app you'll need"), másik a ház-ownereket ("manage your home AND everything else").

#### 5. App Store Discovery Nehézség
**Részletezés:** Az App Store-ban a "maintenance" keresés nem egy kategória. A discoverability alacsony organikusan.  
**Mitigálás:** ASO (App Store Optimization): releváns kulcsszavak, jó screenshots, korai reviews kérése a béta userektől.

---

### 11.5 Stratégiai Pozícionálás Összefoglalása

```
Drivvo    → "The car maintenance app"          (autó-only, mobil-only)
HomeZada  → "The home maintenance app"         (ház-only, drága)
Wrenchly  → "Everything you own, one place"    (multi-category, web+mobil, $4.99)
```

**A Wrenchly nem akarja legyőzni a Drivvo-t az autós szegmensben** — az autós user egy szeleté célozza ahol a Drivvo nem elég: azokat akik egyszerre autót, házat, kertet és egyebet is akarnak követni. Ez egy alulszolgált, de valós és fizető réteg.

---

## 12. Kockázatok és Mitigálás

| Kockázat | Valószínűség | Hatás | Mitigálás |
|---------|-------------|-------|-----------|
| Lassú organikus növekedés | Magas | Közepes | Korai SEO content, Discord community |
| Churn magasabb mint tervezett | Közepes | Magas | Erős onboarding + weekly digest email |
| App Store rejection | Alacsony | Közepes | Guideline-ok betartása, korai béta build |
| Versenytárs expanzió (pl. Drivvo) | Közepes | Közepes | Multi-category USP erősítése |
| Paddle fizetési problémák | Alacsony | Magas | Backup: Stripe Billing |
| Solo founder burnout | Közepes | Nagyon Magas | 20h/hét max, MVP → launch, majd freelancer |

---

## 12. Azonnali Teendők (Legjobb ROI Sorrendben)

1. **Infrastruktúra konfigurálás** (1-2 nap) — env vars, Vercel deploy, DB migrate
2. **Landing page + waitlist** (1 nap) — emailek gyűjtése már most, indulás előtt
3. **Paddle integráció** (2-3 nap) — subscription lifecycle webhookok
4. **App Store submission** (fél nap) — Apple review időigénye miatt minél hamarabb
5. **Product Hunt "Coming Soon"** aktiválása — ingyen, upvotereket gyűjt

> **Konklúzió:** A pesszimista szcenárióban is 2027 közepére profitábilis lesz a projekt, az átlagosban már 2026 novemberben. Az optimistában 2026 szeptemberben. Mellékjövedelemként az átlagos szcenárió 2028-ra havi ~$2,500 nettó profitot jelent teljes automatizmussal.
