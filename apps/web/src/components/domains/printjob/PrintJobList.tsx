'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, ChevronDown, ChevronUp, Pencil, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MATERIAL_TYPES } from './AddPrintJobForm'
import type { PrintJob } from '@prisma/client'

function EditPrintJobForm({ job, onDone }: { job: PrintJob; onDone: () => void }) {
  const utils = api.useUtils()
  const [startedAt, setStartedAt] = useState(new Date(job.startedAt).toISOString().slice(0, 10))
  const [durationMin, setDurationMin] = useState(job.durationMin?.toString() ?? '')
  const [filamentGrams, setFilamentGrams] = useState(String(job.filamentGrams))
  const [materialType, setMaterialType] = useState(job.materialType)
  const [success, setSuccess] = useState(job.success)
  const [notes, setNotes] = useState(job.notes ?? '')

  const updateJob = api.printJob.update.useMutation({
    onSuccess: () => {
      toast.success('Print job updated')
      utils.printJob.listByItemId.invalidate()
      utils.printJob.getStatistics.invalidate()
      onDone()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateJob.mutate({
      id: job.id,
      startedAt: new Date(startedAt),
      durationMin: durationMin ? Number(durationMin) : undefined,
      filamentGrams: Number(filamentGrams),
      materialType,
      success,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-printjob-date-${job.id}`}>Date *</Label>
          <DateField id={`edit-printjob-date-${job.id}`} value={startedAt} onChange={setStartedAt} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-printjob-duration-${job.id}`}>Duration (min)</Label>
          <Input id={`edit-printjob-duration-${job.id}`} type="number" value={durationMin} onChange={(e) => setDurationMin((e.target as HTMLInputElement).value)} min="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-printjob-filament-${job.id}`}>Filament used (g) *</Label>
          <Input id={`edit-printjob-filament-${job.id}`} type="number" value={filamentGrams} onChange={(e) => setFilamentGrams((e.target as HTMLInputElement).value)} min="0" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-printjob-material-${job.id}`}>Material</Label>
          <Select value={materialType} onValueChange={(v) => { if (v !== null) setMaterialType(v) }}>
            <SelectTrigger id={`edit-printjob-material-${job.id}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              {!MATERIAL_TYPES.includes(materialType as (typeof MATERIAL_TYPES)[number]) && (
                <SelectItem value={materialType}>{materialType}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor={`edit-printjob-success-${job.id}`}>Successful print</Label>
        <Switch id={`edit-printjob-success-${job.id}`} checked={success} onCheckedChange={setSuccess} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`edit-printjob-notes-${job.id}`}>Notes</Label>
        <Textarea id={`edit-printjob-notes-${job.id}`} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
      </div>

      {updateJob.error && <p className="text-sm text-destructive">{updateJob.error.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateJob.isPending}>
          {updateJob.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function PrintJobList({ jobs }: { jobs: PrintJob[] }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteJob = api.printJob.delete.useMutation({
    onSuccess: () => {
      utils.printJob.listByItemId.invalidate()
      utils.printJob.getStatistics.invalidate()
    },
  })

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No print jobs logged yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const isExpanded = expanded === job.id

        return (
          <Card key={job.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : job.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {job.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{job.materialType}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(job.startedAt).toLocaleDateString()}</span>
                    <span>{job.filamentGrams} g</span>
                    {job.durationMin != null && <span>{(job.durationMin / 60).toFixed(1)} h</span>}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === job.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditPrintJobForm job={job} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== job.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  {job.notes && <p className="text-sm text-muted-foreground pt-3">{job.notes}</p>}
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(job.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this print job?')) deleteJob.mutate({ id: job.id }) }}
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

export function PrintJobListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}
