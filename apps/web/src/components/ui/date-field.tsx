import { Input } from './input'
import { Button } from './button'
import { cn } from '@/lib/utils'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DateField({
  id,
  value,
  onChange,
  required,
  className,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}) {
  const today = todayIso()

  return (
    <div className={cn('flex gap-1.5', className)}>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        required={required}
        className="flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="shrink-0"
        disabled={value === today}
        onClick={() => onChange(today)}
      >
        Today
      </Button>
    </div>
  )
}
