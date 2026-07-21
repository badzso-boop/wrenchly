import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { SettingsClient } from '@/components/domains/settings/SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <SettingsClient />
}
