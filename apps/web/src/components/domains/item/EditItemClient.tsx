'use client'
import { api } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { ItemStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function EditItemClient({ itemId }: { itemId: string }) {
  const router = useRouter()
  const item = api.item.getById.useQuery({ id: itemId })
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ItemStatus>('ACTIVE')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')

  useEffect(() => {
    if (item.data) {
      setName(item.data.name)
      setBrand(item.data.brand ?? '')
      setModel(item.data.model ?? '')
      setDescription(item.data.description ?? '')
      setStatus(item.data.status)
      setPurchaseDate(item.data.purchaseDate ? new Date(item.data.purchaseDate).toISOString().split('T')[0] ?? '' : '')
      setPurchasePrice(item.data.purchasePrice ? String(item.data.purchasePrice) : '')
    }
  }, [item.data])

  const updateItem = api.item.update.useMutation({ onSuccess: () => router.push(`/items/${itemId}`) })
  const deleteItem = api.item.delete.useMutation({ onSuccess: () => router.push('/dashboard') })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateItem.mutate({
      id: itemId, name,
      brand: brand || undefined, model: model || undefined,
      description: description || undefined, status,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
    })
  }

  if (item.isLoading) return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4"><Skeleton className="h-8 w-48" /></div>
      <div className="px-6 py-6 max-w-lg mx-auto w-full space-y-4">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Edit Item</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-lg mx-auto space-y-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" value={brand} onChange={(e) => setBrand((e.target as HTMLInputElement).value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" value={model} onChange={(e) => setModel((e.target as HTMLInputElement).value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <DateField id="purchaseDate" value={purchaseDate} onChange={setPurchaseDate} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input id="purchasePrice" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice((e.target as HTMLInputElement).value)} min="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus)}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="SCRAPPED">Scrapped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} rows={3} />
                </div>
                {updateItem.error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{updateItem.error.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={updateItem.isPending || !name}>
                  {updateItem.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-destructive mb-1">Danger Zone</p>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this item and all related maintenance records.
              </p>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteItem.isPending}
                onClick={() => {
                  if (window.confirm('Delete this item and all its records? This cannot be undone.'))
                    deleteItem.mutate({ id: itemId })
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteItem.isPending ? 'Deleting…' : 'Delete Item'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
