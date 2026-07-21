import { notFound } from 'next/navigation'
import { db } from '@/server/db'

export const dynamic = 'force-dynamic'

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const share = await db.shareExport.findUnique({ where: { id } })

  if (!share) notFound()
  if (share.expiresAt && share.expiresAt < new Date()) notFound()

  return (
    <div className="min-h-screen bg-white text-neutral-900 px-4 py-10">
      <style>{`
        .share-content { max-width: 640px; margin: 0 auto; font-family: ui-sans-serif, system-ui, sans-serif; }
        .share-content h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
        .share-content h2 { font-size: 1.1rem; font-weight: 600; margin-top: 2rem; margin-bottom: 0.75rem; }
        .share-content .meta { color: #6b7280; margin-bottom: 0.5rem; }
        .share-content .description { margin-bottom: 1rem; }
        .share-content .empty { color: #6b7280; font-style: italic; }
        .share-content table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .share-content th, .share-content td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e5e7eb; }
        .share-content th { color: #6b7280; font-weight: 500; }
      `}</style>
      <div className="share-content" dangerouslySetInnerHTML={{ __html: share.content }} />
    </div>
  )
}
