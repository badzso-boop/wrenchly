// Single source of truth for landing-page copy. Plain data only — no JSX, no 'use client' —
// so it can be imported from server components without pulling client-only code along.

interface Cta {
  label: string
  href: string
}

interface HeroContent {
  eyebrow: string
  title: string
  subtitle: string
  primaryCta: Cta
  secondaryCta: Cta
}

interface Feature {
  id: string
  title: string
  description: string
  /** Name of a lucide-react icon export (e.g. "Wrench"). */
  icon: string
}

interface HowItWorksStep {
  step: number
  title: string
  description: string
}

interface FinalCta {
  title: string
  description: string
  cta: Cta
}

export const heroContent: HeroContent = {
  eyebrow: 'Karbantartás-nyilvántartó',
  title: 'Sose felejts el egy olajcserét sem',
  subtitle:
    'Nyilvántartod a birtokodban lévő dolgokat — jármű, ingatlan, növény, kisállat, 3D nyomtató, kerékpár, akvárium, medence, hajó, drón, hangszer, napelemes rendszer, vagy bármi egyéni domain —, a rendszer pedig emlékeztet a karbantartásukra, mielőtt elfelejtenéd.',
  primaryCta: { label: 'Regisztráció', href: '/register' },
  secondaryCta: { label: 'Bejelentkezés', href: '/login' },
}

export const features: Feature[] = [
  {
    id: 'item-tracking',
    title: 'Bármi, amid van',
    description:
      'Jármű, ingatlan, otthon, növény, kisállat, kerékpár, 3D nyomtató, akvárium, medence, hajó, drón, hangszer, napelemes rendszer — 11 beépített, típus-specifikus profillal, plusz egy generikus motor, ami mindet kiszolgálja.',
    icon: 'Package',
  },
  {
    id: 'maintenance-log',
    title: 'Karbantartási napló',
    description:
      'Rögzítsd az elvégzett munkákat a felhasznált alkatrészekkel, költségekkel és fotókkal — mindig visszakereshető előzmény minden tárgyadhoz.',
    icon: 'Wrench',
  },
  {
    id: 'reminders',
    title: 'Emlékeztetők',
    description:
      'Dátum-, intervallum-, cron- vagy akár időjárás-alapú triggerrel (pl. fagyveszély, locsolási emlékeztető), csendes órák beállításával — sose maradj le egy esedékes teendőről.',
    icon: 'Bell',
  },
  {
    id: 'inventory',
    title: 'Alkatrész- és fogyóeszköz-készlet',
    description:
      'Vezesd, mi van otthon raktáron, és generálj belőle bevásárlólistát, mielőtt elfogyna valami fontos.',
    icon: 'ShoppingCart',
  },
  {
    id: 'trip-fuel',
    title: 'Út- és tankolási napló',
    description:
      'Rögzítsd az utakat és tankolásokat, a rendszer pedig automatikusan számolja a fogyasztási statisztikákat teli tanktól teli tankig.',
    icon: 'Route',
  },
  {
    id: 'readings-statistics',
    title: 'Mérőállások és statisztikák',
    description:
      'Naplózz mérőállásokat (pl. órakör, ciklusszám), és kövesd nyomon az alakulásukat grafikonokon.',
    icon: 'LineChart',
  },
  {
    id: 'print-jobs',
    title: '3D nyomtatási napló',
    description:
      'Rögzítsd a nyomtatási feladataidat — anyagfelhasználástól a nyomtatási időig — egy helyen a nyomtatóddal.',
    icon: 'Printer',
  },
  {
    id: 'cooking',
    title: 'Főzési napló és kedvenc receptek',
    description:
      'Vezesd, mit főztél otthon, és gyűjtsd össze a bevált kedvenc ételeidet.',
    icon: 'ChefHat',
  },
  {
    id: 'household-finance',
    title: 'Háztartási pénzügyek',
    description:
      'Kövesd nyomon az otthonoddal kapcsolatos kiadásokat és bevételeket egy helyen a többi karbantartási adattal.',
    icon: 'Wallet',
  },
  {
    id: 'custom-domain',
    title: 'Egyéni domainek',
    description:
      'Ha egy tárgytípus nincs beépítve, hozz létre sajátot egyéni mezőkkel és naplóépítővel — vagy tallózz mások által megosztott domainek között a store-ban.',
    icon: 'Blocks',
  },
  {
    id: 'calendar-feed',
    title: 'Naptár export',
    description:
      'Iratkozz fel az emlékeztetőidre iCal-feedként Google Calendarban, Apple Calendarban vagy Outlookban.',
    icon: 'Calendar',
  },
  {
    id: 'notifications',
    title: 'Email és push értesítések',
    description:
      'Kapj emlékeztetőket emailben vagy push értesítésként, heti összefoglalóval, a saját preferenciáid szerint.',
    icon: 'CheckCheck',
  },
  {
    id: 'share',
    title: 'Megosztható adatlapok',
    description:
      'Oszd meg egy tárgyad karbantartási előzményét egy nyilvános linkkel, bejelentkezés nélkül elérhetően — kiváló eladáshoz.',
    icon: 'Share2',
  },
]

export const howItWorks: HowItWorksStep[] = [
  {
    step: 1,
    title: 'Regisztrálj, és válaszd ki, mit követnél',
    description:
      'Regisztráció után egy rövid onboarding végigvezet: jelöld ki, milyen típusú dolgaid vannak (jármű, ingatlan, növény, kisállat, 3D nyomtató, stb.) — bármikor bővítheted később.',
  },
  {
    step: 2,
    title: 'Állítsd be az értesítéseket',
    description:
      'Kapcsold be az email-emlékeztetőket, és iratkozz fel a naptár-feedre, hogy Google Calendarban, Apple Calendarban vagy Outlookban is lásd az esedékes teendőket.',
  },
  {
    step: 3,
    title: 'Add hozzá az első tárgyadat',
    description:
      'Add meg a típust és a nevet, majd töltsd ki a típus-specifikus adatokat (pl. jármű esetén rendszám és kilométeróra) — a rendszer ez alapján állítja össze a megfelelő naplókat és füleket.',
  },
  {
    step: 4,
    title: 'Naplózz, és hagyd, hogy emlékeztessen',
    description:
      'Rögzíts karbantartásokat, utakat, tankolásokat vagy mérőállásokat, állíts be emlékeztetőket — a rendszer szól időben, mielőtt esedékessé válna valami.',
  },
]

export const finalCta: FinalCta = {
  title: 'Kezdd el most a nyilvántartást',
  description:
    'Regisztrálj, és soha többé ne felejts el egy karbantartást sem — akármid is van.',
  cta: { label: 'Ingyenes regisztráció', href: '/register' },
}
