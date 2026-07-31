'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FuzzyMatchConfirmDialog, type SimilarNameCandidate } from '@/components/domains/cooking/FuzzyMatchConfirmDialog'

export function AddFavoriteMealForm({ itemId, onSuccess }: { itemId: string; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [candidates, setCandidates] = useState<SimilarNameCandidate[] | null>(null)

  const create = api.favoriteMeal.create.useMutation({
    onSuccess: (result) => {
      if (result.status === 'possible_duplicate') {
        setCandidates(result.candidates)
        return
      }
      toast.success('Favorite meal saved')
      onSuccess()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate({ itemId, name, notes: notes || undefined })
  }

  function handleConfirmNew() {
    create.mutate({ itemId, name, notes: notes || undefined, forceNew: true })
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base">Add Favorite Meal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fm-name">Name *</Label>
              <Input id="fm-name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="e.g. Carbonara" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fm-notes">Notes</Label>
              <Textarea id="fm-notes" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={2} placeholder="Optional" />
            </div>

            {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}

            <Button type="submit" className="w-full" disabled={create.isPending || !name}>
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {candidates && (
        <FuzzyMatchConfirmDialog
          open={!!candidates}
          onOpenChange={(open) => { if (!open) setCandidates(null) }}
          candidates={candidates}
          onConfirmNew={handleConfirmNew}
        />
      )}
    </>
  )
}
