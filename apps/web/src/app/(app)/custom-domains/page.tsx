import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { CustomDomainsPageClient } from '@/components/domains/custom-domain/CustomDomainsPageClient'

export default async function CustomDomainsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <CustomDomainsPageClient />
}
