'use client'
import { api } from '@/lib/trpc/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getProfileFields } from '@/server/domains/profile/profile.fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileFieldInput } from '@/components/domains/profile/ProfileFieldInput'
import { toValues, toPayload, type FormValues } from '@/components/domains/profile/profile-form-utils'
import { VehicleProfileFields, emptyVehicleForm, toVehiclePayload, type VehicleFormValues } from '@/components/domains/vehicle/VehicleProfileFields'
import { toFieldDef } from '@/components/domains/custom-domain/CustomProfileClient'
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

// Name placeholder examples, shown on step 2 regardless of type.
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

  const [step, setStep] = useState<1 | 2>(1)
  const [type, setType] = useState<ItemType>(isItemType(initialType) ? initialType : 'VEHICLE')
  const [customDomainId, setCustomDomainId] = useState('')

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')
  const [vehicleForm, setVehicleForm] = useState<VehicleFormValues>(emptyVehicleForm)
  const [profileValues, setProfileValues] = useState<FormValues>({})
  const [customValues, setCustomValues] = useState<FormValues>({})

  const isVehicle = type === 'VEHICLE'
  const isCustom = type === 'CUSTOM'
  const profileFields = getProfileFields(type) ?? []
  const hasProfileFields = profileFields.length > 0
  const isGenericSimple = !isVehicle && !isCustom && !hasProfileFields

  const myDomains = api.customDomain.listMine.useQuery(undefined, { enabled: isCustom })
  const selectedDomain = myDomains.data?.find((d) => d.id === customDomainId)
  const customFields = (selectedDomain?.fields ?? [])
    .filter((f) => !f.loggable && !f.archivedAt)
    .map(toFieldDef)

  const createItem = api.item.create.useMutation()
  const vehicleCreate = api.vehicle.create.useMutation()
  const profileUpsert = api.profile.upsert.useMutation()
  const attachDomain = api.customDomain.attachItem.useMutation()
  const upsertCustomData = api.customDomain.upsertItemData.useMutation()

  const anyPending =
    createItem.isPending || vehicleCreate.isPending || profileUpsert.isPending || attachDomain.isPending || upsertCustomData.isPending
  const anyError = createItem.error ?? vehicleCreate.error ?? profileUpsert.error ?? attachDomain.error ?? upsertCustomData.error

  function handleTypeChange(v: string) {
    setType(v as ItemType)
    setCustomDomainId('')
  }

  function goToStep2() {
    if (isCustom && !customDomainId) return
    setProfileValues(toValues(profileFields, {}))
    setCustomValues(toValues(customFields, {}))
    setStep(2)
  }

  function handleBack() {
    if (step === 2) setStep(1)
    else router.back()
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name || anyPending) return

    createItem.mutate(
      {
        name,
        type,
        brand: isGenericSimple ? brand || undefined : undefined,
        model: isGenericSimple ? model || undefined : undefined,
        description: description || undefined,
      },
      {
        onSuccess: (item) => {
          if (isVehicle) {
            vehicleCreate.mutate(
              { itemId: item.id, ...toVehiclePayload(vehicleForm) },
              { onSuccess: () => router.push(`/items/${item.id}`) }
            )
          } else if (hasProfileFields) {
            profileUpsert.mutate(
              { itemId: item.id, data: toPayload(profileFields, profileValues) },
              { onSuccess: () => router.push(`/items/${item.id}`) }
            )
          } else if (isCustom) {
            attachDomain.mutate(
              { itemId: item.id, customDomainId },
              {
                onSuccess: () => {
                  if (customFields.length > 0) {
                    upsertCustomData.mutate(
                      { itemId: item.id, data: toPayload(customFields, customValues) },
                      {
                        onSuccess: () => router.push(`/items/${item.id}`),
                        onError: () => router.push(`/items/${item.id}`),
                      }
                    )
                  } else {
                    router.push(`/items/${item.id}`)
                  }
                },
              }
            )
          } else {
            router.push(`/items/${item.id}`)
          }
        },
      }
    )
  }

  const typeLabel = ITEM_TYPES.find((t) => t.value === type)?.label.replace(/^\S+\s/, '') ?? type

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Add New Item</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-lg mx-auto">
          {step === 1 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">What are you adding?</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); goToStep2() }} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select value={type} onValueChange={(v) => { if (v !== null) handleTypeChange(v) }}>
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

                  {isCustom && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-domain">Custom domain *</Label>
                      {myDomains.isLoading ? (
                        <Skeleton className="h-10 rounded-md" />
                      ) : myDomains.data && myDomains.data.length > 0 ? (
                        <Select value={customDomainId} onValueChange={(v) => { if (v !== null) setCustomDomainId(v) }}>
                          <SelectTrigger id="custom-domain">
                            <SelectValue placeholder="Select a domain…" />
                          </SelectTrigger>
                          <SelectContent>
                            {myDomains.data.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.icon ? `${d.icon} ` : ''}{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          You don&apos;t have any custom domains yet.{' '}
                          <Link href="/custom-domains" className="underline">Create one</Link> first, then come back here.
                        </p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isCustom && !customDomainId}>
                    Next
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{typeLabel} details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-5">
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

                  {isVehicle && <VehicleProfileFields form={vehicleForm} setForm={setVehicleForm} />}

                  {hasProfileFields && profileFields.map((field) => (
                    <ProfileFieldInput
                      key={field.key}
                      field={field}
                      values={profileValues}
                      onChange={(key, value) => setProfileValues((prev) => ({ ...prev, [key]: value }))}
                    />
                  ))}

                  {isCustom && (
                    customFields.length > 0 ? (
                      customFields.map((field) => (
                        <ProfileFieldInput
                          key={field.key}
                          field={field}
                          values={customValues}
                          onChange={(key, value) => setCustomValues((prev) => ({ ...prev, [key]: value }))}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This domain has no profile fields yet — you can add some later from Custom Domains.
                      </p>
                    )
                  )}

                  {isGenericSimple && (
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

                  {anyError && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{anyError.message}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={!name || anyPending}>
                    {anyPending ? 'Creating…' : 'Create Item'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
