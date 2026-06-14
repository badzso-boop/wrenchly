# Wrenchly — Marketing Terv (Minimális Befektetéssel)

**Dátum:** 2026. június 14.  
**Cél:** Maximum organikus elérés, $0–200/hó marketingköltséggel az első évben

---

## 1. Alapelv: "Earn Media First"

A Wrenchly marketing stratégiájának alapja, hogy **nem fizetünk figyelemért amíg nem bizonyított a konverzió.** Minden energia a következő sorrendbe megy:

1. **Owned media** (amit mi irányítunk): blog, SEO, email lista, közösségi profilok
2. **Earned media** (amit mások adnak): Reddit megemlítések, YouTube reviews, sajtó
3. **Paid media** (amit megveszünk): Google Ads, Meta Ads — csak break-even után

---

## 2. Pre-Launch Fázis (2026. jún.–aug.) — $0 költség

### 2.1 Waitlist Landing Page

**Cél:** 500+ email cím összegyűjtése launch előtt.

**Tartalom:**
- 1 mondatos érték ajánlat ("Never forget an oil change again — track everything you own in one place")
- 3 screenshot / animált GIF az app-ból
- Email mező + "Join waitlist" CTA
- Számláló: "X people already waiting"

**Platform:** Vercel (már megvan, $0 extra)  
**Email gyűjtés:** Resend waitlist vagy egyszerű Supabase tábla  
**Domain:** wrenchly.app ($12/év)

**Terjesztési taktika:**
- Email aláírásban link hozzáadása minden kimenő emailhez
- LinkedIn personal poszt: "Building something for DIY folks..."
- Saját Facebook/Reddit profil bio-ba link

### 2.2 "Building in Public" Twitter/X + LinkedIn

**Stratégia:** Hetente 2-3 poszt a fejlesztés folyamatáról — nem termékreklám, hanem mögöttes történet.

**Poszt típusok (váltakozva):**
- "What I learned building X feature" (fejlesztői insight)
- "Day N of building Wrenchly" (folyamat dokumentálás)
- "Here's why I started this" (eredet sztori — autó elfelejett szervizkönyv, stb.)
- "This week's problem: [konkrét tech probléma és megoldás]"
- Behind-the-scenes screenshot az app-ból

**Miért működik:** A "Building in Public" közösség aktív (IndieHackers, Twitter/X) és sokan követik a startup útjait. Nem reklám — hanem sztori. Az indulásra már lesz egy lojális mini közönség.

**Időigény:** 1-2 óra/hét  
**Költség:** $0

### 2.3 IndieHackers Profil

**Cél:** A SaaS/indie founder közösség figyelmének megragadása.

**Teendők:**
- Profil létrehozása: norbert.ujj @ indiehackers.com
- "I'm building Wrenchly — a maintenance tracker for everything you own" intro poszt
- Heti milestone posztok (pl. "First 100 signups", "First $1 MRR")
- Mások posztjaira aktív kommentelés (nem spam, valódi érték hozzáadás)

**Miért működik:** IndieHackers olvasói SaaS termékekre fogékony Product Hunt típusú közönség, sok korai adopter.

---

## 3. Launch Fázis (2026. szeptember) — $0–50 költség

### 3.1 Product Hunt Launch

**A legfontosabb egyetlen nap.**

**Előkészítés (2-3 héttel előtte):**
- Product Hunt "Coming Soon" oldal aktiválása — már gyűjt upvotereket
- Barátok, ismerősök felkészítése: "Launch napon reggel kérlek szavazz"
- "Hunter" keresése: valaki akinek sok PH követője van (optional, de segít)

**Launch nap taktika:**
- Kedd reggel 12:01 AM PT (San Francisco idő szerint) — amikor a napi számlálók resetelnek
- Személyes üzenet küldése minden ismerősnek (nem spam-broadcast, hanem 1:1 üzenet)
- Aktív jelenlét a komment szekcióban egész nap — minden kérdésre válasz
- "Maker comment" rögtön launch után: miért csináltuk, kinek szól

**Mit várjunk:**
- Top 5 of the day → ~500-2000 látogató aznap
- Top 1 of the day → ~2000-5000 látogató, PH newsletter megemlítés

**Költség:** $0 (Product Hunt ingyenes)

### 3.2 Hacker News "Show HN"

**Poszt cím:** `Show HN: Wrenchly – track maintenance for everything you own (car, house, garden, 3D printer)`

**Időzítés:** Hétfő/kedd reggel 9-10 AM ET (legjobb engagement idő)

**Mi kell a jó Show HN-hez:**
- Működő demo (nem csak landing page)
- Átlátható árazás az első kommentben
- Technikai mélység az implementációról (HN közönség tech-savvy)
- Gyors, őszinte válasz minden kommentre

**Reális elvárás:** 10-50 pont → ~200-1000 látogató  
**Virális esetben:** 100+ pont → több ezer látogató és PH-szerű spike

### 3.3 Reddit Launch Posztok

**Stratégia:** NEM reklám poszt, hanem **"I built this and here's my story"** stílusú poszt.

**Target subredditek (sorrendben):**

| Subreddit | Tagok | Poszt típus |
|-----------|-------|-------------|
| r/SideProject | 180k | "I built Wrenchly after forgetting my 3rd oil change in a row" |
| r/indiehackers | 95k | Launch announcement + numbers |
| r/DIY | 5.2M | Story + tool showcase (nem reklám!) |
| r/Cartalk | 1.1M | "I made an app to track car maintenance — feedback?" |
| r/3Dprinting | 3.8M | "Tracking 3D printer maintenance — built an app for it" |
| r/homeimprovement | 4.2M | "Built a free tool for home maintenance tracking" |
| r/lawncare | 780k | Seasonal maintenance tracking angle |
| r/motorcycles | 1.2M | Service log tracking angle |

**Szabályok a reddit sikerhez:**
- Soha ne posztolj ugyanazt mindenhova azonos napon
- Mindig illeszkedj a szubreddit kultúrájához (r/DIY nem akarja látni a pricing page-t)
- Free tier legyen valóban ingyenes és értékes — így nem tiltják le
- Reagálj minden kommentre az első 2 órában

**Magyar közösségek is:**
- r/hungary — "Csináltam egy appot amivel nyilvántarthatod a szervizt..."
- Facebook: "Barkácsoljunk együtt" csoport, "Autószerelők klubja" csoport

### 3.4 Email Waitlist Aktiválás

**Sequence (Resend-del):**

1. **Launch email** (launch napon): "We're live! Here's your early access"
   - Személyes hangnem (Norbertől, nem "Wrenchly csapattól")
   - Korai adopter kedvezmény: 3 hónapig 30% off
   - CTA: Start your free account

2. **7 nap múlva — Onboarding nudge**: "Did you add your first item?"
   - Ha nem aktiváltak: tutorial / "stuck somewhere?"
   - Ha aktiváltak: "How's it going? Any feedback?"

3. **30 nap múlva — Upgrade prompt**: "You've been using Wrenchly for a month..."
   - Konkrét statisztika: "You've tracked X maintenance records"
   - Értékajánlat az upgrade-re

---

## 4. Post-Launch Organikus Növekedés (2026. okt.–2027.) — $0–100/hó

### 4.1 SEO Content Marketing

**Célkitűzés:** 6 hónap alatt 10 SEO-optimalizált blog poszt, ami long-tail kulcsszavakra rankol.

**Keyword stratégia (alacsony verseny, célzott):**

| Kulcsszó | Havi keresés | Verseny | Tartalom ötlet |
|---------|-------------|---------|---------------|
| car maintenance tracker app | 1,200 | Alacsony | Comparison + review poszt |
| oil change reminder app | 2,400 | Közepes | "5 best oil change reminder apps" |
| home maintenance log template | 3,600 | Alacsony | Free template + Wrenchly CTA |
| lawn mower maintenance schedule | 1,800 | Alacsony | Szezonális útmutató |
| 3d printer maintenance checklist | 900 | Nagyon alacsony | Teljes checklist |
| motorcycle service log app | 600 | Nagyon alacsony | Review + comparison |
| when to service lawn mower | 4,400 | Közepes | Évszakos útmutató |
| home appliance maintenance schedule | 1,200 | Alacsony | Átfogó útmutató |

**Tartalom formátum:**
- 1,500–2,500 szó/cikk
- Valódi, hasznos tartalom — nem AI spam
- Belső link a Wrenchly free tier-re
- "Free template" letöltés → email cím bekérés

**Eszközök ($0):** Google Search Console, Ahrefs free tier, Wrenchly saját Vercel blogja

**Időigény:** 3-4 óra/cikk, havonta 1-2 cikk reális solo foundernek

### 4.2 YouTube Shorts / TikTok

**Stratégia:** 30-60 másodperces "before/after" és "did you know" videók.

**Videó ötletek:**
- "I forgot my 4th oil change. So I built this app." (eredettörténet, hook: relatable)
- "Track your car maintenance in 30 seconds" (screen recording + voiceover)
- "Everything I maintain with one app" (personal showcase — autó, kert, 3D nyomtató)
- "How much did I spend on car maintenance last year?" (app-ból adat)
- "The right time to replace your lawnmower blade" (educational + Wrenchly CTA)

**Platform prioritás:**
1. YouTube Shorts (kereshetőbb, hosszabb élettartam)
2. TikTok (nagyobb organikus reach, de rövidebb életciklus)
3. Instagram Reels (Facebook crossposting)

**Felszerelés szükséges:** Telefon kamera + OBS screen recording + DaVinci Resolve (ingyenes)  
**Időigény:** 2-3 óra/videó  
**Köztség:** $0

### 4.3 Community Building

**Discord szerver létrehozása:**
- Neve: "Wrenchly Community" vagy "DIY Maintenance Hub"
- Csatornák: #general, #car-maintenance, #home-maintenance, #garden, #3d-printing, #feature-requests, #showcase
- Cél: ne egy support csatorna legyen, hanem egy tényleges HOBBYiSTa közösség
- Havi "maintenance challenge": pl. "Share your spring garage cleanup checklist"

**Miért Discord és nem Facebook Group:**
- Valódi community feel, nem csak poszt feed
- Könnyebb engagement, gyorsabb feedback loop
- Jobban targetálja a 25-45 éves tech-savvy réteget

**Időigény:** 1-2 óra/hét közösség menedzselés  
**Költség:** $0 (Discord ingyenes 100 user felett is)

### 4.4 Email Newsletter

**"Maintenance Monthly" — havi 1 email az összes felhasználónak:**

Tartalom:
- Szezonális tipp: "Mit kell most szervizelnünk?" (pl. téli gumiváltás, tavaszi kert)
- App újdonságok (új feature, UI javítás)
- User spotlight: valaki érdekes maintenance setupja
- "This month's reminder": 1 konkrét dolog amit sok ember elfelejt

**Miért működik:**
- Emlékezteti az inaktív usereket az app-ra
- Csökkenti a churnt (értéket ad a subscription mellé)
- Email list az owned media — platform-független

---

## 5. Affiliate és Partnership Stratégia (2027-től)

### 5.1 YouTube Creator Affiliate Program

**Célzott csatorna típusok:**

| Csatorna típus | Példák | Ajánlott juttatás |
|---------------|--------|------------------|
| DIY autószerelés | ChrisFix (9M), Scotty Kilmer (6M), Project Farm | 30% first-year revenue |
| Ház és kert | This Old House, DIY Creators | 25% first-year revenue |
| 3D nyomtatás | Maker's Muse, CHEP | 30% first-year revenue |
| Általános DIY | I Like To Make Stuff, Matthias Wandel | 25% first-year revenue |

**Megközelítés:**
- Kisebb csatornák (50k-500k) jobban elérhetők és szebb konverziót hoznak
- Személyes email a creator-nek (nem PR agency-n keresztül)
- Ingyenes Personal account + saját affiliate link + 30% komisszió

**Affiliate tracking:** Paddle beépített affiliate support → $0 extra tool

### 5.2 Blog/Newsletter Cross-Promotion

- Más indie maker / SaaS founder cserepartnerség: egymás listáin megemlítjük a terméket
- Niche blogok (autós, kerti, DIY): "tools we love" szekcióba kerülni

---

## 6. Fizetett Hirdetés (Break-even után, 2027+)

**Alapelv:** Csak akkor kezdünk el fizetett hirdetésre költ, ha az organikus csatornákon már mértük a konverziót és tudjuk a CAC-ot (Customer Acquisition Cost).

### 6.1 Google Ads

**Célzott kulcsszavak:**

| Kulcsszó | Havi keresés | Becsült CPC | Conv. rate | CAC |
|---------|-------------|-------------|------------|-----|
| car maintenance app | 2,400 | $1.20 | 3% | $40 |
| oil change tracker | 1,600 | $0.80 | 4% | $20 |
| home maintenance software | 800 | $2.50 | 2% | $125 |
| maintenance reminder app | 1,200 | $1.50 | 3% | $50 |

**Budget:** $200/hó → ~10-15 fizető user/hó (CAC ~$15-20 a jobb kulcsszavakon)  
**LTV Personal:** ~$4.24 × (1/0.04 churn) = ~$106 → LTV:CAC = 5:1 (elfogadható)

### 6.2 Meta Ads (Facebook/Instagram)

**Targeting:**
- Kor: 30-55
- Nem: Férfi (70%), Nő (30%)
- Érdeklődés: DIY, autószerelés, ház renoválás, kertészet, 3D nyomtatás
- Jövedelem: felső-közép (háztulajdonosok)

**Hirdetés formátum:**
- Video ad: 15-30 mp screen recording + "Never forget maintenance again"
- Carousel: 5 kategória amit az app kezel (autó, ház, kert, 3D nyomtató, kerékpár)

**Budget:** $150/hó tesztelésre, majd scale ha a ROAS >3x

---

## 7. Marketing Naptár — Első Év

| Hónap | Feladat | Platform | Becsült hatás |
|-------|---------|----------|--------------|
| Jún. 2026 | Landing page + waitlist | Vercel | 50-200 email |
| Jún. 2026 | Building in public indítás | Twitter/X, LinkedIn | Brand awareness |
| Jún. 2026 | IndieHackers profil | IH | Founder közösség |
| Júl. 2026 | Product Hunt Coming Soon | PH | Pre-launch upvoters |
| Júl. 2026 | Első 2 SEO blog poszt | Wrenchly blog | Long-term traffic |
| Aug. 2026 | Reddit jelenlét kezdés | Reddit | Community |
| Szept. 2026 | **PRODUCT HUNT LAUNCH** | PH | 500-5000 látogató |
| Szept. 2026 | Hacker News Show HN | HN | Tech közönség |
| Szept. 2026 | Reddit launch posztok | Reddit | Hobbyista közönség |
| Szept. 2026 | Magyar FB csoportok | Facebook | HU közönség |
| Okt. 2026 | Discord szerver indítás | Discord | Community building |
| Okt. 2026 | Első YouTube Short | YouTube | Video discovery |
| Nov. 2026 | Affiliate program indítás | Paddle | Creator partnerek |
| Nov. 2026 | Maintenance Monthly newsletter | Resend | Churn csökkentés |
| Dec. 2026 | Év végi "wrapped" poszt | Minden platform | Viral potential |
| Jan. 2027 | SEO blog: 5 cikk összesen | Blog | Organikus traffic |
| Márc. 2027 | Első fizetett Google Ads (ha breakeven) | Google | Skálázott növekedés |

---

## 8. Mérőszámok és KPI-ok

| Metrika | Honnan mérhető | Cél (6 hónap) |
|---------|---------------|--------------|
| Waitlist méret | Resend / Supabase | 500+ |
| Havi organikus látogató | Google Search Console | 1,000+ |
| Email lista mérete | Resend | 800+ |
| Product Hunt upvotes | PH dashboard | Top 5 of day |
| Reddit poszt reach | Reddit analytics | 5,000+ view/poszt |
| Free → Paid konverzió | Paddle dashboard | >4% |
| Monthly churn | Paddle | <5% |
| NPS score | Typeform (ingyenes) | >40 |

---

## 9. Összesített Marketing Költségvetés

| Fázis | Időszak | Havi költség | Fő csatornák |
|-------|---------|-------------|-------------|
| Pre-launch | 2026. jún.–aug. | $0 | Saját platformok, waitlist |
| Launch | 2026. szept. | $0–50 | PH, HN, Reddit, email |
| Organikus növekedés | 2026. okt.–2027. márc. | $0–100 | SEO, YouTube, Discord, newsletter |
| Skálázás | 2027. ápr.+ | $200–500 | Google Ads + Meta Ads + affiliate |
| **ÖSSZESEN első év** | | **~$300–500** | |

**Összehasonlítás:** Egy tipikus SaaS startupnál az első évben $10,000-50,000 marketingköltség lenne. Wrenchly-nél a niche célzottság és az organikus csatornák miatt ez töredékére szorítható.

---

## 10. A Legolcsóbb, Legnagyobb Hatású Taktika

Ha csak **egyetlen** marketing cselekedtre lenne idő és energia, ez legyen:

> **Reddit "I built this" poszt az r/SideProject és r/DIY subredditeken, launch napon, személyes történettel.**

Ez az egyetlen poszt reálisan hozhat 500-2000 látogatót $0 költséggel, egy napra. Ha a free tier értékes, sokan maradnak.
