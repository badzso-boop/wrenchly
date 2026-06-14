import { Resend } from 'resend'
import { getTranslations } from '@wrenchly/i18n'

const resend = new Resend(process.env.RESEND_API_KEY!)

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

  await resend.emails.send({
    from: 'Wrenchly <reminders@wrenchly.app>',
    to: params.to,
    subject,
    text: `${subject}\n\n${body}\n\n${params.actionUrl}`,
    html: `<p><strong>${subject}</strong></p><p>${body}</p><p><a href="${params.actionUrl}">View in Wrenchly</a></p>`,
  })
}
