'use client'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import { Trash2, ChevronDown, ChevronUp, Pencil, ChefHat } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { FavoriteMeal } from '@prisma/client'

function EditFavoriteMealForm({ meal, onDone }: { meal: FavoriteMeal; onDone: () => void }) {
  const utils = api.useUtils()
  const [name, setName] = useState(meal.name)
  const [notes, setNotes] = useState(meal.notes ?? '')

  const update = api.favoriteMeal.update.useMutation({
    onSuccess: () => {
      toast.success('Favorite meal updated')
      utils.favoriteMeal.listByItemId.invalidate()
      onDone()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate({ id: meal.id, name, notes: notes || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="space-y-1.5">
        <Label htmlFor={`edit-fm-name-${meal.id}`}>Name *</Label>
        <Input id={`edit-fm-name-${meal.id}`} value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`edit-fm-notes-${meal.id}`}>Notes</Label>
        <Textarea id={`edit-fm-notes-${meal.id}`} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} />
      </div>
      {update.error && <p className="text-sm text-destructive">{update.error.message}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function FavoriteMealList({ itemId, meals }: { itemId: string; meals: FavoriteMeal[] }) {
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const deleteMeal = api.favoriteMeal.delete.useMutation({
    onSuccess: () => utils.favoriteMeal.listByItemId.invalidate(),
  })

  if (meals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No favorite meals yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {meals.map((meal) => {
        const isExpanded = expanded === meal.id
        return (
          <Card key={meal.id} className="transition-all duration-200 hover:shadow-sm">
            <CardContent className="p-0">
              <button className="w-full p-4 text-left flex items-center gap-4" onClick={() => setExpanded(isExpanded ? null : meal.id)}>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{meal.name}</span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && editingId === meal.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t">
                  <EditFavoriteMealForm meal={meal} onDone={() => setEditingId(null)} />
                </div>
              )}

              {isExpanded && editingId !== meal.id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150 border-t space-y-3 pt-3">
                  {meal.notes && <p className="text-sm text-muted-foreground">{meal.notes}</p>}
                  <div className="flex flex-wrap justify-end gap-1 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/items/${itemId}/cooking-log?prefillName=${encodeURIComponent(meal.name)}`} />}
                      nativeButton={false}
                    >
                      <ChefHat className="h-3.5 w-3.5 mr-1" /> Cooked this today
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(meal.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm('Delete this favorite?')) deleteMeal.mutate({ id: meal.id }) }}
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

export function FavoriteMealListSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
  )
}
