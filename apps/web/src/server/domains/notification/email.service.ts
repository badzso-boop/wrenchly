import { getTranslations } from '@wrenchly/i18n'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SENDER = { name: 'Wrenchly', email: 'wrenchly@ujjweb.hu' }

async function sendBrevoEmail(params: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY is not set')

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Brevo API error (${response.status}): ${body}`)
  }
}

export async function sendReminderEmail(params: {
  to: string
  locale: string
  itemName: string
  reminderTitle: string
  actionUrl: string
}): Promise<void> {
  const t = getTranslations(params.locale)
  const subject = t('notifications.reminder_due.title')
  const body = t('notifications.reminder_due.body', {
    itemName: params.itemName,
    reminderTitle: params.reminderTitle,
  })

  await sendBrevoEmail({
    to: params.to,
    subject,
    text: `${subject}\n\n${body}\n\n${params.actionUrl}`,
    html: `<p><strong>${subject}</strong></p><p>${body}</p><p><a href="${params.actionUrl}">View in Wrenchly</a></p>`,
  })
}

export async function sendUpcomingReminderEmail(params: {
  to: string
  locale: string
  itemName: string
  reminderTitle: string
  dueAt: Date
  actionUrl: string
}): Promise<void> {
  const t = getTranslations(params.locale)
  const subject = t('notifications.reminder_upcoming.title')
  const body = t('notifications.reminder_upcoming.body', {
    itemName: params.itemName,
    reminderTitle: params.reminderTitle,
    dueDate: params.dueAt.toLocaleDateString(params.locale),
  })

  await sendBrevoEmail({
    to: params.to,
    subject,
    text: `${subject}\n\n${body}\n\n${params.actionUrl}`,
    html: `<p><strong>${subject}</strong></p><p>${body}</p><p><a href="${params.actionUrl}">View in Wrenchly</a></p>`,
  })
}

export async function sendWeeklyDigestEmail(params: {
  to: string
  locale: string
  items: { itemName: string; reminderTitle: string; dueAt: Date }[]
  actionUrl: string
}): Promise<void> {
  const t = getTranslations(params.locale)
  const subject = t('notifications.weekly_digest.title')
  const intro = t('notifications.weekly_digest.intro')

  const rows = params.items
    .map(
      (i) =>
        `<li><strong>${i.itemName}</strong> — ${i.reminderTitle} (${i.dueAt.toLocaleDateString(params.locale)})</li>`
    )
    .join('')
  const textRows = params.items
    .map((i) => `- ${i.itemName} — ${i.reminderTitle} (${i.dueAt.toLocaleDateString(params.locale)})`)
    .join('\n')

  await sendBrevoEmail({
    to: params.to,
    subject,
    text: `${subject}\n\n${intro}\n\n${textRows}\n\n${params.actionUrl}`,
    html: `<p><strong>${subject}</strong></p><p>${intro}</p><ul>${rows}</ul><p><a href="${params.actionUrl}">View in Wrenchly</a></p>`,
  })
}

export async function sendKeyedEmail(params: {
  to: string
  locale: string
  titleKey: string
  bodyKey: string
  bodyParams: Record<string, string | number>
  actionUrl: string
}): Promise<void> {
  const t = getTranslations(params.locale)
  const subject = t(params.titleKey)
  const body = t(params.bodyKey, params.bodyParams)

  await sendBrevoEmail({
    to: params.to,
    subject,
    text: `${subject}\n\n${body}\n\n${params.actionUrl}`,
    html: `<p><strong>${subject}</strong></p><p>${body}</p><p><a href="${params.actionUrl}">View in Wrenchly</a></p>`,
  })
}
