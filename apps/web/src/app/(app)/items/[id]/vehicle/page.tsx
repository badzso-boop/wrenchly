import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { VehiclePageClient } from '@/components/domains/vehicle/VehiclePageClient'

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  const { id } = await params
  return <VehiclePageClient itemId={id} />
}
