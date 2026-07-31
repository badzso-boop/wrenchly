import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { PublishedDomainsClient } from '@/components/domains/custom-domain/PublishedDomainsClient'

export default async function PublishedDomainsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <PublishedDomainsClient />
}
