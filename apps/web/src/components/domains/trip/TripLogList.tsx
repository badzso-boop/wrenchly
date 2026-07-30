'use client'
import { api } from '@/lib/trpc/client'
import { Trash2, ChevronDown, ChevronUp, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FUEL_TYPES } from '@/components/domains/vehicle/VehicleProfileClient'
import type { TripLog, TripFuelStop, TripExpense } from '@prisma/client'

type TripWithChildren = TripLog & { fuelStops: TripFuelStop[]; expenses: TripExpense[] }

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

function consumptionLabel(trip: TripWithChildren): string | null {
  const fuelQty = Number(trip.totalFuelQty)
  if (fuelQty <= 0 || trip.distanceKm <= 0) return null
  const per100 = fuelQty / (trip.distanceKm / 100)
  return `${per100.toFixed(1)} L/100km`
}

function EditTripLogForm({ trip, onDone }: { trip: TripWithChildren; onDone: () => void }) {
  const utils = api.useUtils()
  const [startedAt, setStartedAt] = useState(new Date(trip.startedAt).toISOString().slice(0, 10))
  const [startOdometer, setStartOdometer] = useState(String(trip.startOdometer))
  const [distanceKm, setDistanceKm] = useState(String(trip.distanceKm))
  const [description, setDescription] = useState(trip.description ?? '')
  const [notes, setNotes] = useState(trip.notes ?? '')
  const [startFuelLiters, setStartFuelLiters] = useState(trip.startFuelLiters?.toString() ?? '')
  const [fuelStops, setFuelStops] = useState<FuelStopForm[]>(
    trip.fuelStops.map((f) => ({
      quantity: String(f.quantity),
      unit: f.unit as 'liter' | 'kWh',
      pricePerUnit: String(f.pricePerUnit),
      currency: f.currency,
      fuelType: f.fuelType ?? '',
      station: f.station ?? '',
    }))
  )
  const [expenses, setExpenses] = useState<ExpenseForm[]>(
    trip.expenses.map((e) => ({
      type: e.type,
      amount: String(e.amount),
      currency: e.currency,
      description: e.description ?? '',
    }))
  )

  const updateTrip = api.trip.update.useMutation({
    onSuccess: () => {
      toast.success('Trip updated')
      utils.trip.listByItemId.invalidate()
      utils.trip.getStatistics.invalidate()
      onDone()
    },
  })

  function addFuelStop() {
    setFuelStops([...fuelStops, { quantity: '', unit: 'liter', pricePerUnit: '', currency: 'HUF', fuelType: '', station: '' }])
  }
  function updateFuelStop(index: number, field: keyof FuelStopForm, value: string) {
    setFuelStops(fuelStops.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }
  function removeFuelStop(index: number) {
    setFuelStops(fuelStops.filter((_, i) => i !== index))
  }

  function addExpense() {
    setExpenses([...expenses, { type: 'TOLL', amount: '', currency: 'HUF', description: '' }])
  }
  function updateExpense(index: number, field: keyof ExpenseForm, value: string) {
    setExpenses(expenses.map((e, i) => (i === index ? { ...e, [field]: value } : e)))
  }
  function removeExpense(index: number) {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateTrip.mutate({
      id: trip.id,
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
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-trip-date-${trip.id}`}>Date *</Label>
          <DateField id={`edit-trip-date-${trip.id}`} value={startedAt} onChange={setStartedAt} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-trip-desc-${trip.id}`}>Description</Label>
          <Input id={`edit-trip-desc-${trip.id}`} value={description} onChange={(e) => setDescription((e.target as HTMLInputElement).value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-trip-start-odo-${trip.id}`}>Starting odometer (km) *</Label>
          <Input id={`edit-trip-start-odo-${trip.id}`} type="number" value={startOdometer} onChange={(e) => setStartOdometer((e.target as HTMLInputElement).value)} min="0" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-trip-distance-${trip.id}`}>Distance (km) *</Label>
          <Input id={`edit-trip-distance-${trip.id}`} type="number" value={distanceKm} onChange={(e) => setDistanceKm((e.target as HTMLInputElement).value)} min="1" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`edit-trip-start-fuel-${trip.id}`}>Approx. fuel at start (liters)</Label>
        <Input id={`edit-trip-start-fuel-${trip.id}`} type="number" value={startFuelLiters} onChange={(e) => setStartFuelLiters((e.target as HTMLInputElement).value)} min="0" />
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor={`edit-trip-notes-${trip.id}`}>What happened on the way</Label>
        <Textarea id={`edit-trip-notes-${trip.id}`} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
      </div>

      {updateTrip.error && <p className="text-sm text-destructive">{updateTrip.error.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateTrip.isPending}>
          {updateTrip.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function TripLogList({ trips }: { trips: TripWithChildren[] }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteTrip = api.trip.delete.useMutation({
    onSuccess: () => {
      utils.trip.listByItemId.invalidate()
      utils.trip.getStatistics.invalidate()
    },
  })

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No trips logged yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {trips.map((trip) => {
        const isExpanded = expanded === trip.id
        const consumption = consumptionLabel(trip)
        const totalCost = Number(trip.totalFuelCost) + Number(trip.totalExpenseCost)

        return (
          <Card key={trip.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : trip.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-sm truncate">{trip.description || 'Trip'}</span>
                    {consumption && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary shrink-0">
                        {consumption}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(trip.startedAt).toLocaleDateString()}</span>
                    <span>{trip.distanceKm.toLocaleString()} km</span>
                    {totalCost > 0 && (
                      <span className="font-medium text-foreground">{totalCost.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === trip.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditTripLogForm trip={trip} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== trip.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Odometer</p>
                      <p className="font-medium">{trip.startOdometer.toLocaleString()} → {trip.endOdometer.toLocaleString()} km</p>
                    </div>
                    {trip.startFuelLiters != null && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">Fuel at start</p>
                        <p className="font-medium">{Number(trip.startFuelLiters)} L</p>
                      </div>
                    )}
                  </div>
                  {trip.notes && <p className="text-sm text-muted-foreground pt-3">{trip.notes}</p>}
                  {trip.fuelStops.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Fuel stops</p>
                      <div className="space-y-1">
                        {trip.fuelStops.map((f) => (
                          <div key={f.id} className="flex items-center justify-between text-sm">
                            <span>{Number(f.quantity)} {f.unit}{f.fuelType ? ` (${f.fuelType})` : ''}{f.station ? ` — ${f.station}` : ''}</span>
                            <span className="text-muted-foreground">{Number(f.totalPaid).toLocaleString()} {f.currency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {trip.expenses.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Tolls, vignettes &amp; parking</p>
                      <div className="space-y-1">
                        {trip.expenses.map((ex) => (
                          <div key={ex.id} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{ex.type.toLowerCase()}{ex.description ? ` — ${ex.description}` : ''}</span>
                            <span className="text-muted-foreground">{Number(ex.amount).toLocaleString()} {ex.currency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(trip.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this trip?')) deleteTrip.mutate({ id: trip.id }) }}
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

export function TripLogListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}
