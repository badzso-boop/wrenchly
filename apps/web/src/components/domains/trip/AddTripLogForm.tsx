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
import { FUEL_TYPES } from '@/components/domains/vehicle/VehicleProfileClient'

const CURRENCIES = ['HUF', 'EUR', 'USD', 'GBP', 'CHF']

const EXPENSE_TYPES: { value: 'TOLL' | 'VIGNETTE' | 'PARKING' | 'OTHER'; label: string }[] = [
  { value: 'TOLL', label: 'Toll' },
  { value: 'VIGNETTE', label: 'Vignette' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'OTHER', label: 'Other' },
]

interface FuelStopForm {
  quantity: string
  unit: 'liter' | 'kWh'
  pricePerUnit: string
  currency: string
  fuelType: string
  station: string
}

interface ExpenseForm {
  type: 'TOLL' | 'VIGNETTE' | 'PARKING' | 'OTHER'
  amount: string
  currency: string
  description: string
}

function emptyFuelStop(): FuelStopForm {
  return { quantity: '', unit: 'liter', pricePerUnit: '', currency: 'HUF', fuelType: '', station: '' }
}

function emptyExpense(): ExpenseForm {
  return { type: 'TOLL', amount: '', currency: 'HUF', description: '' }
}

export function AddTripLogForm({ itemId, onSuccess }: { itemId: string; onSuccess: () => void }) {
  const profile = api.vehicle.getByItemId.useQuery({ itemId })
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 10))
  const [startOdometer, setStartOdometer] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [startFuelLiters, setStartFuelLiters] = useState('')
  const [fuelStops, setFuelStops] = useState<FuelStopForm[]>([])
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

  function addFuelStop() {
    setFuelStops([...fuelStops, emptyFuelStop()])
  }
  function updateFuelStop(index: number, field: keyof FuelStopForm, value: string) {
    setFuelStops(fuelStops.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }
  function removeFuelStop(index: number) {
    setFuelStops(fuelStops.filter((_, i) => i !== index))
  }

  function addExpense() {
    setExpenses([...expenses, emptyExpense()])
  }
  function updateExpense(index: number, field: keyof ExpenseForm, value: string) {
    setExpenses(expenses.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }
  function removeExpense(index: number) {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createTrip.mutate({
      itemId,
      startedAt: new Date(startedAt),
      description: description || undefined,
      notes: notes || undefined,
      startOdometer: Number(startOdometer),
      distanceKm: Number(distanceKm),
      startFuelLiters: startFuelLiters ? Number(startFuelLiters) : undefined,
      fuelStops: fuelStops
        .filter((f) => f.quantity && f.pricePerUnit)
        .map((f) => ({
          quantity: Number(f.quantity),
          unit: f.unit,
          pricePerUnit: Number(f.pricePerUnit),
          currency: f.currency,
          fuelType: f.fuelType || undefined,
          station: f.station || undefined,
        })),
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

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">Log Trip</CardTitle></CardHeader>
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
            <div className="space-y-2">
              <Label htmlFor="trip-start-odo">Starting odometer (km) *</Label>
              <Input id="trip-start-odo" type="number" value={startOdometer} onChange={(e) => setStartOdometer((e.target as HTMLInputElement).value)} min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip-distance">Distance traveled (km) *</Label>
              <Input id="trip-distance" type="number" value={distanceKm} onChange={(e) => setDistanceKm((e.target as HTMLInputElement).value)} min="1" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-start-fuel">Approx. fuel at start (liters)</Label>
            <Input id="trip-start-fuel" type="number" value={startFuelLiters} onChange={(e) => setStartFuelLiters((e.target as HTMLInputElement).value)} min="0" placeholder="Optional" />
          </div>

          {/* Fuel stops */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Fuel Stops</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addFuelStop} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Fuel Stop
              </Button>
            </div>
            {fuelStops.map((stop, i) => {
              const total = (Number(stop.quantity) || 0) * (Number(stop.pricePerUnit) || 0)
              return (
                <div key={i} className="rounded-lg border p-3 mb-2 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <Input type="number" value={stop.quantity} onChange={(e) => updateFuelStop(i, 'quantity', (e.target as HTMLInputElement).value)} placeholder="Qty" min="0" step="0.01" className="h-8 text-sm" />
                    <Select value={stop.unit} onValueChange={(v) => { if (v !== null) updateFuelStop(i, 'unit', v) }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="liter">liter</SelectItem>
                        <SelectItem value="kWh">kWh</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={stop.pricePerUnit} onChange={(e) => updateFuelStop(i, 'pricePerUnit', (e.target as HTMLInputElement).value)} placeholder="Price/unit" min="0" className="h-8 text-sm" />
                    <Select value={stop.currency} onValueChange={(v) => { if (v !== null) updateFuelStop(i, 'currency', v) }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <Select value={stop.fuelType || 'none'} onValueChange={(v) => { if (v !== null) updateFuelStop(i, 'fuelType', v === 'none' ? '' : v) }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Fuel type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Fuel type</SelectItem>
                        {FUEL_TYPES.map((ft) => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={stop.station} onChange={(e) => updateFuelStop(i, 'station', (e.target as HTMLInputElement).value)} placeholder="Station (optional)" className="h-8 text-sm col-span-2" />
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-muted-foreground tabular-nums">{total.toLocaleString()} {stop.currency}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFuelStop(i)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Expenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tolls, Vignettes &amp; Parking</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addExpense} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Expense
              </Button>
            </div>
            {expenses.map((ex, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-center">
                <Select value={ex.type} onValueChange={(v) => { if (v !== null) updateExpense(i, 'type', v) }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" value={ex.amount} onChange={(e) => updateExpense(i, 'amount', (e.target as HTMLInputElement).value)} placeholder="Amount" min="0" className="h-8 text-sm" />
                <Select value={ex.currency} onValueChange={(v) => { if (v !== null) updateExpense(i, 'currency', v) }}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={ex.description} onChange={(e) => updateExpense(i, 'description', (e.target as HTMLInputElement).value)} placeholder="Note" className="h-8 text-sm" />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive justify-self-end" onClick={() => removeExpense(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-notes">What happened on the way</Label>
            <Textarea id="trip-notes" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="Optional" />
          </div>

          {createTrip.error && <p className="text-sm text-destructive">{createTrip.error.message}</p>}

          <Button type="submit" className="w-full" disabled={createTrip.isPending || !startOdometer || !distanceKm}>
            {createTrip.isPending ? 'Saving…' : 'Save Trip'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
