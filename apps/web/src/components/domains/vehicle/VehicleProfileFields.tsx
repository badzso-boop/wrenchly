'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG', 'CNG', 'Hydrogen']

export interface VehicleFormValues {
  make: string; model: string; year: string; vin: string; fuelType: string; engineDisplacement: string
  licensePlate: string; color: string; fuelTankLiters: string; variant: string; powerKw: string
  transmission: string; driveType: string; oilSpec: string; coolantType: string; brakeFluidType: string
  tireSizeFront: string; tireSizeRear: string; tirePressureFront: string; tirePressureRear: string
}

export const emptyVehicleForm: VehicleFormValues = {
  make: '', model: '', year: '', vin: '', fuelType: '', engineDisplacement: '', licensePlate: '', color: '', fuelTankLiters: '',
  variant: '', powerKw: '', transmission: '', driveType: '', oilSpec: '', coolantType: '', brakeFluidType: '',
  tireSizeFront: '', tireSizeRear: '', tirePressureFront: '', tirePressureRear: '',
}

// Shared string-form -> vehicle.create/update payload transform, used both when editing an
// existing vehicle profile and when filling it in as part of item creation.
export function toVehiclePayload(form: VehicleFormValues) {
  return {
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
}

// Shared field-input block used both by VehicleProfileClient (editing an existing profile) and
// NewItemClient's item-creation wizard (filling in the vehicle profile before the item exists).
export function VehicleProfileFields({
  form,
  setForm,
}: {
  form: VehicleFormValues
  setForm: (updater: (f: VehicleFormValues) => VehicleFormValues) => void
}) {
  const set = (field: keyof VehicleFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: (e.target as HTMLInputElement).value }))

  return (
    <>
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
    </>
  )
}
