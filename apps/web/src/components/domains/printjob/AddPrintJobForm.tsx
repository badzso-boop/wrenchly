'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Free string (see PrintJob.materialType), not a DB enum -- this list can grow without a
// migration, same convention as maintenance.categories.ts.
export const MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'TPU', 'Resin', 'Other'] as const

export function AddPrintJobForm({ itemId, onSuccess }: { itemId: string; onSuccess: () => void }) {
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 10))
  const [durationMin, setDurationMin] = useState('')
  const [filamentGrams, setFilamentGrams] = useState('')
  const [materialType, setMaterialType] = useState<string>(MATERIAL_TYPES[0])
  const [success, setSuccess] = useState(true)
  const [notes, setNotes] = useState('')

  const createJob = api.printJob.create.useMutation({
    onSuccess: () => { toast.success('Print job logged'); onSuccess() },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createJob.mutate({
      itemId,
      startedAt: new Date(startedAt),
      durationMin: durationMin ? Number(durationMin) : undefined,
      filamentGrams: Number(filamentGrams),
      materialType,
      success,
      notes: notes || undefined,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">Log Print Job</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="printjob-date">Date *</Label>
              <DateField id="printjob-date" value={startedAt} onChange={setStartedAt} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printjob-duration">Duration (min)</Label>
              <Input id="printjob-duration" type="number" value={durationMin} onChange={(e) => setDurationMin((e.target as HTMLInputElement).value)} min="0" placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="printjob-filament">Filament used (g) *</Label>
              <Input id="printjob-filament" type="number" value={filamentGrams} onChange={(e) => setFilamentGrams((e.target as HTMLInputElement).value)} min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printjob-material">Material</Label>
              <Select value={materialType} onValueChange={(v) => { if (v !== null) setMaterialType(v) }}>
                <SelectTrigger id="printjob-material"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="printjob-success">Successful print</Label>
            <Switch id="printjob-success" checked={success} onCheckedChange={setSuccess} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printjob-notes">Notes</Label>
            <Textarea id="printjob-notes" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="Optional" />
          </div>

          {createJob.error && <p className="text-sm text-destructive">{createJob.error.message}</p>}

          <Button type="submit" className="w-full" disabled={createJob.isPending || !filamentGrams}>
            {createJob.isPending ? 'Saving…' : 'Save Print Job'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
