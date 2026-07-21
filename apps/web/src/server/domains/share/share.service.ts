import { TRPCError } from '@trpc/server'
import { type ShareRepository } from './share.repository'
import { type ItemRepository } from '@/server/domains/item/item.repository'
import { type MaintenanceRepository } from '@/server/domains/maintenance/maintenance.repository'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export class ShareService {
  constructor(
    private shareRepo: ShareRepository,
    private itemRepo: ItemRepository,
    private maintenanceRepo: MaintenanceRepository
  ) {}

  listMine(userId: string) {
    return this.shareRepo.listByUserId(userId)
  }

  async create(itemId: string, userId: string, expiresInDays?: number) {
    const item = await this.itemRepo.findByIdAndUserId(itemId, userId)
    if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.item.not_found' })

    const records = await this.maintenanceRepo.findByItemId(itemId, userId, undefined, 200)
    const content = this.renderSnapshot(item, records)

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    return this.shareRepo.create({ userId, itemId, content, expiresAt })
  }

  async revoke(id: string, userId: string): Promise<void> {
    const share = await this.shareRepo.findByIdAndUserId(id, userId)
    if (!share) throw new TRPCError({ code: 'NOT_FOUND', message: 'errors.share.not_found' })
    await this.shareRepo.delete(id)
  }

  private renderSnapshot(
    item: { name: string; type: string; brand: string | null; model: string | null; description: string | null },
    records: Array<{
      title: string
      category: string
      performedAt: Date
      costTotal: unknown
      notes: string | null
    }>
  ): string {
    const header = `
      <h1>${escapeHtml(item.name)}</h1>
      <p class="meta">${escapeHtml(item.type)}${item.brand ? ` — ${escapeHtml(item.brand)}` : ''}${item.model ? ` ${escapeHtml(item.model)}` : ''}</p>
      ${item.description ? `<p class="description">${escapeHtml(item.description)}</p>` : ''}
    `

    const rows = records
      .map(
        (r) => `
          <tr>
            <td>${escapeHtml(r.performedAt.toLocaleDateString())}</td>
            <td>${escapeHtml(r.title)}</td>
            <td>${escapeHtml(r.category)}</td>
            <td>${r.costTotal !== null ? escapeHtml(String(r.costTotal)) : '—'}</td>
            <td>${r.notes ? escapeHtml(r.notes) : ''}</td>
          </tr>`
      )
      .join('')

    const table = records.length
      ? `
        <table>
          <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Cost</th><th>Notes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`
      : '<p class="empty">No maintenance history recorded yet.</p>'

    return `${header}<h2>Maintenance history</h2>${table}`
  }
}
