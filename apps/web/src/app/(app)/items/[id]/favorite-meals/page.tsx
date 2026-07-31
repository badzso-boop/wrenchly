import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { FavoriteMealPageClient } from '@/components/domains/favorite-meal/FavoriteMealPageClient'

export default async function FavoriteMealsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <FavoriteMealPageClient itemId={id} />
}
