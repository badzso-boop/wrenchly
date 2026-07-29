import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { NewItemClient } from '@/components/domains/item/NewItemClient'

export default async function NewItemPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return (
    <Suspense>
      <NewItemClient />
    </Suspense>
  )
}
