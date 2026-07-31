import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { CustomDomainStoreClient } from '@/components/domains/custom-domain/CustomDomainStoreClient'

export default async function CustomDomainStorePage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  return <CustomDomainStoreClient />
}
