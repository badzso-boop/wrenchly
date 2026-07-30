'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG', 'CNG', 'Hydrogen']

export function VehicleProfileClient({ itemId }: { itemId: string }) {
  const profile = api.vehicle.getByItemId.useQuery({ itemId })
  const [editing, setEditing] = useState(false)
  const [showOdoForm, setShowOdoForm] = useState(false)
  const [newOdometer, setNewOdometer] = useState('')
  const emptyForm = {
    make: '', model: '', year: '', vin: '', fuelType: '', engineDisplacement: '', licensePlate: '', color: '', fuelTankLiters: '',
    variant: '', powerKw: '', transmission: '', driveType: '', oilSpec: '', coolantType: '', brakeFluidType: '',
    tireSizeFront: '', tireSizeRear: '', tirePressureFront: '', tirePressureRear: '',
  }
  const [form, setForm] = useState(emptyForm)

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
    setForm(forNew || !p ? emptyForm : {
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
    const data = {
      make: form.make, model: form.model,
      year: form.year ? Number(form.year) : undefined,
      vin: form.vin || undefined,
      fuelType: form.fuelType || undefined,
      engineDisplacement: form.engineDisplacement ? Number(form.engineDisplacement) : undefined,
      licensePlate: form.licensePlate || undefined,
      color: form.color || undefined,
      fuelTankLiters: form.fuelTankLiters ? Number(form.fuelTankLiters) : undefined,
      variant: form.variant || undefined,
      powerKw: form.powerKw ? Number(form.powerKw) : undefined,
      transmission: form.transmission || undefined,
      driveType: form.driveType || undefined,
      oilSpec: form.oilSpec || undefined,
      coolantType: form.coolantType || undefined,
      brakeFluidType: form.brakeFluidType || undefined,
      tireSizeFront: form.tireSizeFront || undefined,
      tireSizeRear: form.tireSizeRear || undefined,
      tirePressureFront: form.tirePressureFront ? Number(form.tirePressureFront) : undefined,
      tirePressureRear: form.tirePressureRear ? Number(form.tirePressureRear) : undefined,
    }
    if (profile.data) update.mutate({ itemId, ...data })
    else create.mutate({ itemId, ...data })
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: (e.target as HTMLInputElement).value }))

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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input id="make" value={form.make} onChange={set('make')} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vmodel">Model *</Label>
                  <Input id="vmodel" value={form.model} onChange={set('model')} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={form.year} onChange={set('year')} min="1886" max="2100" />
                </div>
                <div className="space-y-2">
                  <Label>Fuel type</Label>
                  <Select value={form.fuelType || 'none'} onValueChange={(v) => { if (v !== null) setForm((f) => ({ ...f, fuelType: v === 'none' ? '' : v })) }}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {FUEL_TYPES.map((ft) => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="engine">Engine (cc)</Label>
                  <Input id="engine" type="number" value={form.engineDisplacement} onChange={set('engineDisplacement')} min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plate">License plate</Label>
                  <Input id="plate" value={form.licensePlate} onChange={set('licensePlate')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" value={form.color} onChange={set('color')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (17 chars)</Label>
                  <Input id="vin" value={form.vin} onChange={(e) => setForm((f) => ({ ...f, vin: (e.target as HTMLInputElement).value.toUpperCase() }))} maxLength={17} pattern="[A-HJ-NPR-Z0-9]{17}" placeholder="Optional" className="font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tank">Fuel tank size (liters)</Label>
                  <Input id="tank" type="number" value={form.fuelTankLiters} onChange={set('fuelTankLiters')} min="0" placeholder="e.g. 55" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant</Label>
                  <Input id="variant" value={form.variant} onChange={set('variant')} placeholder="e.g. Carrera S" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="powerKw">Power (kW)</Label>
                  <Input id="powerKw" type="number" value={form.powerKw} onChange={set('powerKw')} min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Input id="transmission" value={form.transmission} onChange={set('transmission')} placeholder="e.g. 8-speed PDK" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="driveType">Drive type</Label>
                  <Input id="driveType" value={form.driveType} onChange={set('driveType')} placeholder="e.g. RWD" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oilSpec">Oil spec</Label>
                  <Input id="oilSpec" value={form.oilSpec} onChange={set('oilSpec')} placeholder="e.g. 0W-40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="coolantType">Coolant type</Label>
                  <Input id="coolantType" value={form.coolantType} onChange={set('coolantType')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brakeFluidType">Brake fluid type</Label>
                  <Input id="brakeFluidType" value={form.brakeFluidType} onChange={set('brakeFluidType')} placeholder="e.g. DOT 4" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tireSizeFront">Tire size (front)</Label>
                  <Input id="tireSizeFront" value={form.tireSizeFront} onChange={set('tireSizeFront')} placeholder="e.g. 245/35 R20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tireSizeRear">Tire size (rear)</Label>
                  <Input id="tireSizeRear" value={form.tireSizeRear} onChange={set('tireSizeRear')} placeholder="e.g. 305/30 R21" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tirePressureFront">Tire pressure front (bar)</Label>
                  <Input id="tirePressureFront" type="number" step="0.1" value={form.tirePressureFront} onChange={set('tirePressureFront')} min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tirePressureRear">Tire pressure rear (bar)</Label>
                  <Input id="tirePressureRear" type="number" step="0.1" value={form.tirePressureRear} onChange={set('tirePressureRear')} min="0" />
                </div>
              </div>
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
