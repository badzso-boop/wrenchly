'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateField } from '@/components/ui/date-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FUEL_TYPES } from '@/components/domains/vehicle/VehicleProfileFields'

export const CURRENCIES = ['HUF', 'EUR', 'USD', 'GBP', 'CHF']

export function AddFuelUpForm({ itemId, onSuccess }: { itemId: string; onSuccess: () => void }) {
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10))
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [currency, setCurrency] = useState('HUF')
  const [fuelType, setFuelType] = useState('')
  const [station, setStation] = useState('')
  const [notes, setNotes] = useState('')
  const [tripIds, setTripIds] = useState<string[]>([])

  const trips = api.fuelUp.listAssignableTrips.useQuery({ itemId })

  const createFuelUp = api.fuelUp.create.useMutation({
    onSuccess: () => { toast.success('Fuel-up logged'); onSuccess() },
  })

  function toggleTrip(id: string) {
    setTripIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createFuelUp.mutate({
      itemId,
      occurredAt: new Date(occurredAt),
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      currency,
      fuelType: fuelType || undefined,
      station: station || undefined,
      notes: notes || undefined,
      tripIds: tripIds.length > 0 ? tripIds : undefined,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">Log Fuel-up</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fuelup-date">Date *</Label>
              <DateField id="fuelup-date" value={occurredAt} onChange={setOccurredAt} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelup-station">Station</Label>
              <Input id="fuelup-station" value={station} onChange={(e) => setStation((e.target as HTMLInputElement).value)} placeholder="e.g. Shell Veszprém" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fuelup-qty">Quantity (liters) *</Label>
              <Input id="fuelup-qty" type="number" value={quantity} onChange={(e) => setQuantity((e.target as HTMLInputElement).value)} min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelup-price">Price per liter *</Label>
              <Input id="fuelup-price" type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit((e.target as HTMLInputElement).value)} min="0" step="0.01" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => { if (v !== null) setCurrency(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="fuelup-notes">Notes</Label>
            <Textarea id="fuelup-notes" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label>Which trips does this fuel-up cover?</Label>
            <p className="text-xs text-muted-foreground">
              Pick every trip you drove since your last fill-up — a trip can already be covered by
              another fuel-up and still be added here too.
            </p>
            {trips.isLoading && <Skeleton className="h-24 rounded-lg" />}
            {trips.data && trips.data.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">No trips logged yet for this item.</p>
            )}
            {trips.data && trips.data.length > 0 && (
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
                    {trip.fuelUps.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        already covered by {trip.fuelUps.length} fuel-up{trip.fuelUps.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {createFuelUp.error && <p className="text-sm text-destructive">{createFuelUp.error.message}</p>}

          <Button type="submit" className="w-full" disabled={createFuelUp.isPending || !quantity || !pricePerUnit}>
            {createFuelUp.isPending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
