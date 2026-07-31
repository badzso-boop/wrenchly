'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export interface SimilarNameCandidate {
  name: string
  similarity: number
}

// Shared between the Cooking Log and Favorite Meal "create" flows — both check a submitted name
// against existing Cooking Log + Favorite Meal names (pg_trgm similarity) and, on a close match,
// show this confirmation instead of silently saving a near-duplicate.
export function FuzzyMatchConfirmDialog({
  open,
  onOpenChange,
  candidates,
  onConfirmNew,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: SimilarNameCandidate[]
  onConfirmNew: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>This might already exist</DialogTitle>
          <DialogDescription>
            Found {candidates.length} similar name{candidates.length !== 1 ? 's' : ''} already logged for this
            Home. Did you mean one of these, or is this genuinely a new one?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          {candidates.map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(c.similarity * 100)}% match</span>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirmNew(); onOpenChange(false) }}>Save as new anyway</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
