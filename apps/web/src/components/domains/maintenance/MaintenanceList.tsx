'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { MaintenanceRecord, Part } from '@prisma/client'

type RecordWithParts = MaintenanceRecord & { parts: Part[] }

// The full per-item-type category list (see maintenance.categories.ts) is much larger
// than a handful of vehicle terms, so colors are assigned deterministically by hashing
// the category value into a fixed palette instead of hand-maintaining one entry per key.
const CATEGORY_PALETTE = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
]
const OTHER_COLOR = 'bg-muted text-muted-foreground'

function categoryColor(category: string): string {
  if (category === 'OTHER') return OTHER_COLOR
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length] ?? OTHER_COLOR
}

export function MaintenanceList({ records }: { records: RecordWithParts[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const deleteRecord = api.maintenance.delete.useMutation()

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No maintenance records yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const isExpanded = expanded === record.id
        const colorClass = categoryColor(record.category)

        return (
          <Card key={record.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : record.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-sm truncate">{record.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${colorClass}`}>
                      {record.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(record.performedAt).toLocaleDateString()}</span>
                    {record.odometerValue && <span>{Number(record.odometerValue).toLocaleString()} km</span>}
                    {record.costTotal && (
                      <span className="font-medium text-foreground">
                        {Number(record.costTotal).toLocaleString()} Ft
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  {record.notes && (
                    <p className="text-sm text-muted-foreground pt-3 mb-3">{record.notes}</p>
                  )}
                  {record.parts.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Parts used</p>
                      <div className="space-y-1">
                        {record.parts.map((part) => (
                          <div key={part.id} className="flex items-center justify-between text-sm">
                            <span>{part.name}{part.partNumber ? ` (${part.partNumber})` : ''}</span>
                            <span className="text-muted-foreground">
                              {Number(part.quantity)}× {part.unitPrice ? `${Number(part.unitPrice).toLocaleString()} Ft` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this record?')) deleteRecord.mutate({ id: record.id }) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
