import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({ id: 'wrenchly-sync' })

interface PendingOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'maintenanceRecord' | 'item' | 'reminder'
  payload: unknown
  createdAt: number
  retryCount: number
}

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export const syncQueue = {
  getAll(): PendingOperation[] {
    const raw = storage.getString('sync_queue')
    return raw ? (JSON.parse(raw) as PendingOperation[]) : []
  },

  enqueue(op: Pick<PendingOperation, 'type' | 'entity' | 'payload'>): void {
    const pending = this.getAll()
    pending.push({ ...op, id: generateId(), retryCount: 0, createdAt: Date.now() })
    storage.set('sync_queue', JSON.stringify(pending))
  },

  remove(id: string): void {
    const pending = this.getAll().filter((op) => op.id !== id)
    storage.set('sync_queue', JSON.stringify(pending))
  },

  incrementRetry(id: string): void {
    const pending = this.getAll().map((op) =>
      op.id === id ? { ...op, retryCount: op.retryCount + 1 } : op
    )
    storage.set('sync_queue', JSON.stringify(pending))
  },

  getPendingCount(): number {
    return this.getAll().length
  },

  clear(): void {
    storage.delete('sync_queue')
  },
}
