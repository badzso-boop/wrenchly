import huCommon from '../locales/hu/common.json'
import huErrors from '../locales/hu/errors.json'
import huNotifications from '../locales/hu/notifications.json'
import enCommon from '../locales/en/common.json'
import enErrors from '../locales/en/errors.json'
import enNotifications from '../locales/en/notifications.json'

const translations = {
  hu: { ...huCommon, ...huErrors, ...huNotifications },
  en: { ...enCommon, ...enErrors, ...enNotifications },
} as const

export type SupportedLocale = keyof typeof translations

function getNestedValue(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return Object.entries(params).reduce(
    (str, [key, val]) => str.replace(new RegExp(`{{${key}}}`, 'g'), String(val)),
    template
  )
}

export function getTranslations(locale: string) {
  const lang = (locale in translations ? locale : 'en') as SupportedLocale
  const dict = translations[lang] as Record<string, unknown>

  return function t(key: string, params?: Record<string, string | number>): string {
    const value = getNestedValue(dict, key)
    if (!value) return key
    return interpolate(value, params)
  }
}

export type TranslateFn = ReturnType<typeof getTranslations>
