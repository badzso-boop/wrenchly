'use client'
import { api } from '@/lib/trpc/client'
import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTripLogLabels } from '@/server/domains/trip/trip.labels'
import type { ItemType } from '@prisma/client'

const CURRENCIES = ['HUF', 'EUR', 'USD', 'GBP', 'CHF']

const EXPENSE_TYPES: { value: 'TOLL' | 'VIGNETTE' | 'PARKING' | 'OTHER'; label: string }[] = [
  { value: 'TOLL', label: 'Toll' },
  { value: 'VIGNETTE', label: 'Vignette' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'OTHER', label: 'Other' },
]

interface ExpenseForm {
  type: 'TOLL' | 'VIGNETTE' | 'PARKING' | 'OTHER'
  amount: string
  currency: string
  description: string
}

function emptyExpense(): ExpenseForm {
  return { type: 'TOLL', amount: '', currency: 'HUF', description: '' }
}

export function AddTripLogForm({ itemId, itemType, onSuccess }: { itemId: string; itemType: ItemType; onSuccess: () => void }) {
  const labels = getTripLogLabels(itemType)
  const isVehicle = itemType === 'VEHICLE'
  const profile = api.vehicle.getByItemId.useQuery({ itemId }, { enabled: isVehicle })
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 10))
  const [startOdometer, setStartOdometer] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [elevationGainM, setElevationGainM] = useState('')
  const [batteryPercentUsed, setBatteryPercentUsed] = useState('')
  const [maxAltitudeM, setMaxAltitudeM] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [startFuelLiters, setStartFuelLiters] = useState('')
  const [expenses, setExpenses] = useState<ExpenseForm[]>([])

  // Prefill the start odometer from the vehicle's current reading once it loads, but only if
  // the user hasn't already typed something (don't clobber in-progress input on a refetch).
  useEffect(() => {
    if (profile.data?.currentOdometer != null && startOdometer === '') {
      setStartOdometer(String(profile.data.currentOdometer))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data?.currentOdometer])

  const createTrip = api.trip.create.useMutation({
    onSuccess: () => { toast.success('Trip logged'); onSuccess() },
  })

  function addExpense() {
    setExpenses([...expenses, emptyExpense()])
  }
  function updateExpense(index: number, field: keyof ExpenseForm, value: string) {
    setExpenses(expenses.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }
  function removeExpense(index: number) {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  if (!labels) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createTrip.mutate({
      itemId,
      startedAt: new Date(startedAt),
      description: description || undefined,
      notes: notes || undefined,
      startOdometer: labels!.showOdometerFields ? Number(startOdometer) : undefined,
      distanceKm: distanceKm ? Number(distanceKm) : undefined,
      durationMin: durationMin ? Number(durationMin) : undefined,
      elevationGainM: elevationGainM ? Number(elevationGainM) : undefined,
      batteryPercentUsed: batteryPercentUsed ? Number(batteryPercentUsed) : undefined,
      maxAltitudeM: maxAltitudeM ? Number(maxAltitudeM) : undefined,
      startFuelLiters: startFuelLiters ? Number(startFuelLiters) : undefined,
      expenses: expenses
        .filter((ex) => ex.amount)
        .map((ex) => ({
          type: ex.type,
          amount: Number(ex.amount),
          currency: ex.currency,
          description: ex.description || undefined,
        })),
    })
  }

  const canSubmit = (!labels.showOdometerFields || startOdometer) && (!labels.distanceRequired || distanceKm)

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">{labels.formTitle}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="trip-date">Date *</Label>
              <DateField id="trip-date" value={startedAt} onChange={setStartedAt} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-desc">Purpose / description</Label>
              <Input id="trip-desc" value={description} onChange={(e) => setDescription((e.target as HTMLInputElement).value)} placeholder="e.g. Trip to Vienna" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {labels.showOdometerFields && (
              <div className="space-y-2">
                <Label htmlFor="trip-start-odo">{labels.startFieldLabel} *</Label>
                <Input id="trip-start-odo" type="number" value={startOdometer} onChange={(e) => setStartOdometer((e.target as HTMLInputElement).value)} min="0" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="trip-distance">{labels.distanceFieldLabel}{labels.distanceRequired ? ' *' : ''}</Label>
              <Input
                id="trip-distance"
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm((e.target as HTMLInputElement).value)}
                min="0"
                required={labels.distanceRequired}
                placeholder={labels.distanceRequired ? undefined : 'Optional'}
              />
            </div>
            {labels.showDuration && (
              <div className="space-y-2">
                <Label htmlFor="trip-duration">Duration (min)</Label>
                <Input id="trip-duration" type="number" value={durationMin} onChange={(e) => setDurationMin((e.target as HTMLInputElement).value)} min="0" placeholder="Optional" />
              </div>
            )}
            {labels.showElevation && (
              <div className="space-y-2">
                <Label htmlFor="trip-elevation">Elevation gain (m)</Label>
                <Input id="trip-elevation" type="number" value={elevationGainM} onChange={(e) => setElevationGainM((e.target as HTMLInputElement).value)} min="0" placeholder="Optional" />
              </div>
            )}
            {labels.showBattery && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="trip-battery">Battery used (%)</Label>
                  <Input id="trip-battery" type="number" value={batteryPercentUsed} onChange={(e) => setBatteryPercentUsed((e.target as HTMLInputElement).value)} min="0" max="100" placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-altitude">Max altitude (m)</Label>
                  <Input id="trip-altitude" type="number" value={maxAltitudeM} onChange={(e) => setMaxAltitudeM((e.target as HTMLInputElement).value)} min="0" placeholder="Optional" />
                </div>
              </>
            )}
          </div>

          {labels.showFuelSection && (
            <>
              <div className="space-y-2">
                <Label htmlFor="trip-start-fuel">Approx. fuel at start (liters)</Label>
                <Input id="trip-start-fuel" type="number" value={startFuelLiters} onChange={(e) => setStartFuelLiters((e.target as HTMLInputElement).value)} min="0" placeholder="Optional" />
              </div>

              {/* Fuel is no longer entered per-trip — see the standalone Fuel-ups feature
                  (fork 2/3 of the fuel-up decoupling initiative) once it lands. */}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tolls, Vignettes &amp; Parking</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addExpense} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Expense
                  </Button>
                </div>
                {expenses.map((ex, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2 sm:items-center">
                    <Select value={ex.type} onValueChange={(v) => { if (v !== null) updateExpense(i, 'type', v) }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" value={ex.amount} onChange={(e) => updateExpense(i, 'amount', (e.target as HTMLInputElement).value)} placeholder="Amount" min="0" className="h-8 text-sm min-w-0" />
                    <Select value={ex.currency} onValueChange={(v) => { if (v !== null) updateExpense(i, 'currency', v) }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={ex.description} onChange={(e) => updateExpense(i, 'description', (e.target as HTMLInputElement).value)} placeholder="Note" className="h-8 text-sm min-w-0" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive justify-self-end col-span-2 sm:col-span-1" onClick={() => removeExpense(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="trip-notes">What happened on the way</Label>
            <Textarea id="trip-notes" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="Optional" />
          </div>

          {createTrip.error && <p className="text-sm text-destructive">{createTrip.error.message}</p>}

          <Button type="submit" className="w-full" disabled={createTrip.isPending || !canSubmit}>
            {createTrip.isPending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
