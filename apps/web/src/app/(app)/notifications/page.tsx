import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NotificationsClient } from '@/components/domains/notification/NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  return <NotificationsClient />
}
