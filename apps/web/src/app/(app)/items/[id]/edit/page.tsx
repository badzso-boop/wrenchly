import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { EditItemClient } from '@/components/domains/item/EditItemClient'

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  const { id } = await params
  return <EditItemClient itemId={id} />
}
