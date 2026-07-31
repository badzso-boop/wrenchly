import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/server'
import { PrintJobPageClient } from '@/components/domains/printjob/PrintJobPageClient'

export default async function PrintJobsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const { id } = await params
  return <PrintJobPageClient itemId={id} />
}
