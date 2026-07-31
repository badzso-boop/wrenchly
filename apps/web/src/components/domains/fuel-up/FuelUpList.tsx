'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FUEL_TYPES } from '@/components/domains/vehicle/VehicleProfileFields'
import { CURRENCIES } from './AddFuelUpForm'
import type { FuelUp } from '@prisma/client'

type FuelUpWithTrips = FuelUp & { trips: { id: string; startedAt: Date; distanceKm: number }[] }

function EditFuelUpForm({ itemId, fuelUp, onDone }: { itemId: string; fuelUp: FuelUpWithTrips; onDone: () => void }) {
  const utils = api.useUtils()
  const [occurredAt, setOccurredAt] = useState(new Date(fuelUp.occurredAt).toISOString().slice(0, 10))
  const [quantity, setQuantity] = useState(String(fuelUp.quantity))
  const [pricePerUnit, setPricePerUnit] = useState(String(fuelUp.pricePerUnit))
  const [currency, setCurrency] = useState(fuelUp.currency)
  const [fuelType, setFuelType] = useState(fuelUp.fuelType ?? '')
  const [station, setStation] = useState(fuelUp.station ?? '')
  const [notes, setNotes] = useState(fuelUp.notes ?? '')
  const [tripIds, setTripIds] = useState<string[]>(fuelUp.trips.map((t) => t.id))

  const trips = api.fuelUp.listAssignableTrips.useQuery({ itemId })

  const updateFuelUp = api.fuelUp.update.useMutation({
    onSuccess: () => {
      toast.success('Fuel-up updated')
      utils.fuelUp.listByItemId.invalidate()
      utils.trip.getStatistics.invalidate()
      onDone()
    },
  })

  function toggleTrip(id: string) {
    setTripIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateFuelUp.mutate({
      id: fuelUp.id,
      occurredAt: new Date(occurredAt),
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      currency,
      fuelType: fuelType || null,
      station: station || null,
      notes: notes || null,
      tripIds,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-fuelup-date-${fuelUp.id}`}>Date *</Label>
          <DateField id={`edit-fuelup-date-${fuelUp.id}`} value={occurredAt} onChange={setOccurredAt} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-fuelup-station-${fuelUp.id}`}>Station</Label>
          <Input id={`edit-fuelup-station-${fuelUp.id}`} value={station} onChange={(e) => setStation((e.target as HTMLInputElement).value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-fuelup-qty-${fuelUp.id}`}>Quantity (liters) *</Label>
          <Input id={`edit-fuelup-qty-${fuelUp.id}`} type="number" value={quantity} onChange={(e) => setQuantity((e.target as HTMLInputElement).value)} min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-fuelup-price-${fuelUp.id}`}>Price per liter *</Label>
          <Input id={`edit-fuelup-price-${fuelUp.id}`} type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit((e.target as HTMLInputElement).value)} min="0" step="0.01" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v) }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fuel type</Label>
          <Select value={fuelType || 'none'} onValueChange={(v) => { if (v !== null) setFuelType(v === 'none' ? '' : v) }}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {FUEL_TYPES.map((ft) => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`edit-fuelup-notes-${fuelUp.id}`}>Notes</Label>
        <Textarea id={`edit-fuelup-notes-${fuelUp.id}`} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
      </div>

      <div className="space-y-1.5">
        <Label>Which trips does this fuel-up cover?</Label>
        {trips.isLoading && <Skeleton className="h-24 rounded-lg" />}
        {trips.data && (
          <div className="max-h-56 overflow-auto rounded-lg border divide-y">
            {trips.data.map((trip) => (
              <label key={trip.id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-accent/50">
                <input
                  type="checkbox"
                  checked={tripIds.includes(trip.id)}
                  onChange={() => toggleTrip(trip.id)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="flex-1">
                  {new Date(trip.startedAt).toLocaleDateString()} — {trip.distanceKm.toLocaleString()} km
                </span>
                {trip.fuelUps.length > 0 && !trip.fuelUps.every((f) => f.id === fuelUp.id) && (
                  <span className="text-xs text-muted-foreground">also covered elsewhere</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {updateFuelUp.error && <p className="text-sm text-destructive">{updateFuelUp.error.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateFuelUp.isPending}>
          {updateFuelUp.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function FuelUpList({ itemId, fuelUps }: { itemId: string; fuelUps: FuelUpWithTrips[] }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const deleteFuelUp = api.fuelUp.delete.useMutation({
    onSuccess: () => {
      utils.fuelUp.listByItemId.invalidate()
      utils.trip.getStatistics.invalidate()
    },
  })

  if (fuelUps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No fuel-ups logged yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {fuelUps.map((fuelUp) => {
        const isExpanded = expanded === fuelUp.id
        const totalDistance = fuelUp.trips.reduce((sum, t) => sum + t.distanceKm, 0)

        return (
          <Card key={fuelUp.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpanded(isExpanded ? null : fuelUp.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {Number(fuelUp.quantity).toLocaleString()} {fuelUp.unit}
                      {fuelUp.station ? ` — ${fuelUp.station}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(fuelUp.occurredAt).toLocaleDateString()}</span>
                    <span className="font-medium text-foreground">
                      {Number(fuelUp.totalPaid).toLocaleString()} {fuelUp.currency}
                    </span>
                    <span>
                      {fuelUp.trips.length === 0
                        ? 'no trips assigned'
                        : `covers ${fuelUp.trips.length} trip${fuelUp.trips.length > 1 ? 's' : ''}, ${totalDistance.toLocaleString()} km`}
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === fuelUp.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditFuelUpForm itemId={itemId} fuelUp={fuelUp} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== fuelUp.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Price per unit</p>
                      <p className="font-medium">{Number(fuelUp.pricePerUnit).toLocaleString()} {fuelUp.currency}</p>
                    </div>
                    {fuelUp.fuelType && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">Fuel type</p>
                        <p className="font-medium">{fuelUp.fuelType}</p>
                      </div>
                    )}
                  </div>
                  {fuelUp.notes && <p className="text-sm text-muted-foreground pt-3">{fuelUp.notes}</p>}
                  {fuelUp.trips.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Covered trips</p>
                      <div className="space-y-1">
                        {fuelUp.trips.map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-sm">
                            <span>{new Date(t.startedAt).toLocaleDateString()}</span>
                            <span className="text-muted-foreground">{t.distanceKm.toLocaleString()} km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(fuelUp.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this fuel-up?')) deleteFuelUp.mutate({ id: fuelUp.id }) }}
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

export function FuelUpListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  )
}
