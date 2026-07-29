'use client'
import { api } from '@/lib/trpc/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { getProfileFields } from '@/server/domains/profile/profile.fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ItemType } from '@prisma/client'

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: 'VEHICLE', label: '🚗 Vehicle' },
  { value: 'PROPERTY', label: '🏠 Property' },
  { value: 'PLANT', label: '🌱 Plant' },
  { value: 'MACHINE', label: '⚙️ Machine' },
  { value: 'TOOL', label: '🔧 Tool' },
  { value: 'DEVICE', label: '📱 Device' },
  { value: 'PRINTER_3D', label: '🖨️ 3D Printer' },
  { value: 'PET', label: '🐾 Pet' },
  { value: 'AQUARIUM', label: '🐠 Aquarium' },
  { value: 'POOL', label: '🏊 Pool' },
  { value: 'BOAT', label: '⛵ Boat' },
  { value: 'DRONE', label: '🚁 Drone / RC' },
  { value: 'INSTRUMENT', label: '🎸 Instrument' },
  { value: 'BICYCLE', label: '🚲 Bicycle' },
  { value: 'SOLAR', label: '☀️ Solar System' },
  { value: 'CUSTOM', label: '📦 Custom' },
]

// Only shown for types with no dedicated profile (VEHICLE has its own make/model on
// VehicleProfile; MACHINE/TOOL/DEVICE/CUSTOM have nothing else, so the generic fields
// here are the only place to record a brand/model for them).
const NAME_EXAMPLES: Partial<Record<ItemType, string>> = {
  VEHICLE: 'e.g. Ford Focus 2015',
  PROPERTY: 'e.g. Main House',
  PLANT: 'e.g. Living room Monstera',
  MACHINE: 'e.g. Table saw',
  TOOL: 'e.g. Cordless drill',
  DEVICE: 'e.g. Laptop',
  PRINTER_3D: 'e.g. Bedroom printer',
  PET: 'e.g. Rex',
  AQUARIUM: 'e.g. Living room tank',
  POOL: 'e.g. Backyard pool',
  BOAT: 'e.g. Weekend sailboat',
  DRONE: 'e.g. Racing drone',
  INSTRUMENT: 'e.g. Acoustic guitar',
  BICYCLE: 'e.g. Commuter bike',
  SOLAR: 'e.g. Roof solar array',
  CUSTOM: 'e.g. Home server',
}

function isItemType(value: string | null): value is ItemType {
  return value !== null && ITEM_TYPES.some((t) => t.value === value)
}

export function NewItemClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type')
  const [name, setName] = useState('')
  const [type, setType] = useState<ItemType>(isItemType(initialType) ? initialType : 'VEHICLE')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')

  const hasProfileFields = getProfileFields(type) !== null
  const showGenericBrandModel = !hasProfileFields

  const createItem = api.item.create.useMutation({
    onSuccess: (item) => {
      if (type === 'VEHICLE') router.push(`/items/${item.id}/vehicle`)
      else if (hasProfileFields || type === 'CUSTOM') router.push(`/items/${item.id}/profile`)
      else router.push(`/items/${item.id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createItem.mutate({
      name,
      type,
      brand: showGenericBrandModel ? brand || undefined : undefined,
      model: showGenericBrandModel ? model || undefined : undefined,
      description: description || undefined,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Add New Item</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={NAME_EXAMPLES[type] ?? 'e.g. My item'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={type} onValueChange={(v) => { if (v !== null) setType(v as ItemType) }}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showGenericBrandModel && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Ford"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. Focus"
                      />
                    </div>
                  </div>
                )}

                {hasProfileFields && (
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll fill in {ITEM_TYPES.find((t) => t.value === type)?.label.replace(/^\S+\s/, '')}-specific
                    details (like watering schedule, breed, engine hours…) right after creating this item.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Any additional info…"
                  />
                </div>

                {createItem.error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{createItem.error.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={createItem.isPending || !name}>
                  {createItem.isPending ? 'Creating…' : 'Create Item'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
