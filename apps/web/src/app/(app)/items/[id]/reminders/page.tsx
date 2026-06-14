import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ReminderPageClient } from '@/components/domains/reminder/ReminderPageClient'

export default async function RemindersPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  const { id } = await params
  return <ReminderPageClient itemId={id} />
}
