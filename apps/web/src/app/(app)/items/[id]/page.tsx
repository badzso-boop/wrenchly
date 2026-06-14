import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ItemDetailClient } from '@/components/domains/item/ItemDetailClient'

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  const { id } = await params
  return <ItemDetailClient itemId={id} />
}
