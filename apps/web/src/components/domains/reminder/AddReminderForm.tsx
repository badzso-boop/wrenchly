'use client'
import { api } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type TriggerType = 'DATE' | 'INTERVAL_DAYS' | 'ODOMETER' | 'CRON' | 'WEATHER'

const WEATHER_CONDITIONS = [
  { value: 'frost_warning', label: 'Frost warning' },
  { value: 'temp_above', label: 'Temperature above threshold' },
  { value: 'no_rain_48h', label: 'No rain in 48h' },
  { value: 'last_frost_passed', label: 'Last frost passed' },
]

export function AddReminderForm({ itemId, onSuccess }: { itemId: string; onSuccess: () => void }) {
  const [title, setTitle] = useState('')
  const [triggerType, setTriggerType] = useState<TriggerType>('INTERVAL_DAYS')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [days, setDays] = useState('30')
  const [odometerThreshold, setOdometerThreshold] = useState('')
  const [cronExpr, setCronExpr] = useState('0 9 1 * *')
  const [weatherCondition, setWeatherCondition] = useState('frost_warning')
  const [weatherThreshold, setWeatherThreshold] = useState('0')

  const create = api.reminder.create.useMutation({
    onSuccess: () => { toast.success('Reminder created'); onSuccess() },
  })

  function buildConfig(): Record<string, unknown> {
    switch (triggerType) {
      case 'DATE': return time ? { date, time } : { date }
      case 'INTERVAL_DAYS': return { days: Number(days) }
      case 'ODOMETER': return { threshold: Number(odometerThreshold) }
      case 'CRON': return { expression: cronExpr }
      case 'WEATHER': return { condition: weatherCondition, threshold: Number(weatherThreshold) }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate({ itemId, title, triggerType, triggerConfig: buildConfig() })
  }

  return (
    <Card>
      <CardHeader className="pb-4"><CardTitle className="text-base">New Reminder</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} placeholder="e.g. Oil change due" required />
          </div>

          <div className="space-y-2">
            <Label>Trigger type *</Label>
            <Select value={triggerType} onValueChange={(v) => { if (v !== null) setTriggerType(v as TriggerType) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERVAL_DAYS">Repeat every N days</SelectItem>
                <SelectItem value="DATE">Specific date</SelectItem>
                <SelectItem value="ODOMETER">Odometer threshold (km)</SelectItem>
                <SelectItem value="CRON">Custom schedule (cron)</SelectItem>
                <SelectItem value="WEATHER">Weather condition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {triggerType === 'DATE' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate((e.target as HTMLInputElement).value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime((e.target as HTMLInputElement).value)} />
                <p className="text-xs text-muted-foreground">Only affects the calendar event — email/push still goes out on the daily check.</p>
              </div>
            </div>
          )}

          {triggerType === 'INTERVAL_DAYS' && (
            <div className="space-y-2">
              <Label htmlFor="days">Repeat every (days) *</Label>
              <Input id="days" type="number" value={days} onChange={(e) => setDays((e.target as HTMLInputElement).value)} min="1" required />
            </div>
          )}

          {triggerType === 'ODOMETER' && (
            <div className="space-y-2">
              <Label htmlFor="odometer">Trigger at km *</Label>
              <Input id="odometer" type="number" value={odometerThreshold} onChange={(e) => setOdometerThreshold((e.target as HTMLInputElement).value)} min="0" placeholder="e.g. 15000" required />
            </div>
          )}

          {triggerType === 'CRON' && (
            <div className="space-y-2">
              <Label htmlFor="cron">Cron expression *</Label>
              <Input id="cron" value={cronExpr} onChange={(e) => setCronExpr((e.target as HTMLInputElement).value)} placeholder="0 9 1 * *" required className="font-mono" />
              <p className="text-xs text-muted-foreground">"0 9 1 * *" = 1st of every month at 9am</p>
            </div>
          )}

          {triggerType === 'WEATHER' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Condition *</Label>
                <Select value={weatherCondition} onValueChange={(v) => { if (v !== null) setWeatherCondition(v) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEATHER_CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {weatherCondition === 'temp_above' && (
                <div className="space-y-2">
                  <Label htmlFor="temp">Temperature threshold (°C)</Label>
                  <Input id="temp" type="number" value={weatherThreshold} onChange={(e) => setWeatherThreshold((e.target as HTMLInputElement).value)} />
                </div>
              )}
            </div>
          )}

          {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}

          <Button type="submit" className="w-full" disabled={create.isPending || !title}>
            {create.isPending ? 'Saving…' : 'Add Reminder'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
