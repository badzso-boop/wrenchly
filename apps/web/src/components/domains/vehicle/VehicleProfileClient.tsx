'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { VehicleProfileFields, emptyVehicleForm, toVehiclePayload } from './VehicleProfileFields'

export { FUEL_TYPES } from './VehicleProfileFields'

export function VehicleProfileClient({ itemId }: { itemId: string }) {
  const profile = api.vehicle.getByItemId.useQuery({ itemId })
  const [editing, setEditing] = useState(false)
  const [showOdoForm, setShowOdoForm] = useState(false)
  const [newOdometer, setNewOdometer] = useState('')
  const [form, setForm] = useState(emptyVehicleForm)

  const create = api.vehicle.create.useMutation({
    onSuccess: () => { profile.refetch(); setEditing(false); toast.success('Vehicle profile created') },
  })
  const update = api.vehicle.update.useMutation({
    onSuccess: () => { profile.refetch(); setEditing(false); toast.success('Vehicle profile updated') },
  })
  const updateOdometer = api.vehicle.updateOdometer.useMutation({
    onSuccess: () => { profile.refetch(); setShowOdoForm(false); setNewOdometer(''); toast.success('Odometer updated') },
  })

  function openEdit(forNew: boolean) {
    const p = profile.data
    setForm(forNew || !p ? emptyVehicleForm : {
      make: p.make, model: p.model, year: p.year?.toString() ?? '', vin: p.vin ?? '',
      fuelType: p.fuelType ?? '', engineDisplacement: p.engineDisplacement?.toString() ?? '',
      licensePlate: p.licensePlate ?? '', color: p.color ?? '',
      fuelTankLiters: p.fuelTankLiters?.toString() ?? '',
      variant: p.variant ?? '', powerKw: p.powerKw?.toString() ?? '', transmission: p.transmission ?? '',
      driveType: p.driveType ?? '', oilSpec: p.oilSpec ?? '', coolantType: p.coolantType ?? '',
      brakeFluidType: p.brakeFluidType ?? '', tireSizeFront: p.tireSizeFront ?? '', tireSizeRear: p.tireSizeRear ?? '',
      tirePressureFront: p.tirePressureFront?.toString() ?? '', tirePressureRear: p.tirePressureRear?.toString() ?? '',
    })
    setEditing(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = toVehiclePayload(form)
    if (profile.data) update.mutate({ itemId, ...data })
    else create.mutate({ itemId, ...data })
  }

  if (profile.isLoading) return <Skeleton className="h-48 rounded-xl" />

  const p = profile.data

  return (
    <div className="space-y-4">
      {p && !editing && (
        <>
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base">Vehicle Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => openEdit(false)}>Edit</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {([
                  ['Make', p.make], ['Model', p.model],
                  p.variant && ['Variant', p.variant],
                  p.year && ['Year', String(p.year)],
                  p.fuelType && ['Fuel', p.fuelType],
                  p.engineDisplacement && ['Engine (cc)', String(p.engineDisplacement)],
                  p.powerKw && ['Power (kW)', String(p.powerKw)],
                  p.transmission && ['Transmission', p.transmission],
                  p.driveType && ['Drive', p.driveType],
                  p.licensePlate && ['Plate', p.licensePlate],
                  p.color && ['Color', p.color],
                  p.fuelTankLiters && ['Tank size', `${p.fuelTankLiters} L`],
                  p.oilSpec && ['Oil spec', p.oilSpec],
                  p.coolantType && ['Coolant', p.coolantType],
                  p.brakeFluidType && ['Brake fluid', p.brakeFluidType],
                  p.tireSizeFront && ['Tire (front)', p.tireSizeFront],
                  p.tireSizeRear && ['Tire (rear)', p.tireSizeRear],
                  p.tirePressureFront && ['Tire pressure (front)', `${p.tirePressureFront} bar`],
                  p.tirePressureRear && ['Tire pressure (rear)', `${p.tirePressureRear} bar`],
                ].filter(Boolean) as string[][]).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
              {p.vin && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">VIN</p>
                    <p className="font-mono text-xs font-medium">{p.vin}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Odometer</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {p.currentOdometer ? Number(p.currentOdometer).toLocaleString() : '—'}
                      <span className="text-base font-normal text-muted-foreground ml-1">km</span>
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setShowOdoForm(!showOdoForm)}>
                  {showOdoForm ? 'Cancel' : 'Update km'}
                </Button>
              </div>

              {showOdoForm && (
                <form
                  onSubmit={(e) => { e.preventDefault(); updateOdometer.mutate({ itemId, odometer: Number(newOdometer) }) }}
                  className="flex gap-2 mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-150"
                >
                  <Input
                    type="number"
                    value={newOdometer}
                    onChange={(e) => setNewOdometer((e.target as HTMLInputElement).value)}
                    placeholder="New km value"
                    min={p.currentOdometer ? Number(p.currentOdometer) + 1 : 0}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" disabled={updateOdometer.isPending}>
                    {updateOdometer.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </form>
              )}
              {updateOdometer.error && <p className="text-sm text-destructive mt-2">{updateOdometer.error.message}</p>}
            </CardContent>
          </Card>
        </>
      )}

      {!p && !editing && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No vehicle profile set up yet.</p>
            <Button onClick={() => openEdit(true)}>Set up Vehicle Profile</Button>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card className="animate-in slide-in-from-bottom-2 duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{p ? 'Edit Vehicle Profile' : 'New Vehicle Profile'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <VehicleProfileFields form={form} setForm={setForm} />
              {(create.error ?? update.error) && (
                <p className="text-sm text-destructive">{(create.error ?? update.error)?.message}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={create.isPending || update.isPending}>
                  {create.isPending || update.isPending ? 'Saving…' : 'Save Profile'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
