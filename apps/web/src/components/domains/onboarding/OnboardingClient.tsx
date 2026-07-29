'use client'
import { api } from '@/lib/trpc/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Copy, Check, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const HOBBIES: { value: string; label: string }[] = [
  { value: 'VEHICLE', label: '🚗 Vehicles' },
  { value: 'PROPERTY', label: '🏠 Property' },
  { value: 'PLANT', label: '🌱 Garden & plants' },
  { value: 'PET', label: '🐾 Pets' },
  { value: 'BICYCLE', label: '🚲 Bicycles' },
  { value: 'PRINTER_3D', label: '🖨️ 3D printing' },
  { value: 'AQUARIUM', label: '🐠 Aquarium' },
  { value: 'BOAT', label: '⛵ Boat' },
  { value: 'DRONE', label: '🚁 Drone / RC' },
  { value: 'INSTRUMENT', label: '🎸 Instruments' },
  { value: 'SOLAR', label: '☀️ Solar system' },
  { value: 'CUSTOM', label: '📦 Something else' },
]

export function OnboardingClient() {
  const router = useRouter()
  const state = api.onboarding.getState.useQuery()
  const [step, setStep] = useState<'hobbies' | 'notifications' | 'confirm'>('hobbies')
  const [selected, setSelected] = useState<string[]>([])

  const [emailEnabled, setEmailEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const calendarToken = api.user.getOrCreateCalendarToken.useQuery()
  const upsertPref = api.user.upsertNotifPref.useMutation()

  useEffect(() => {
    if (state.data?.selectedHobbies?.length) setSelected(state.data.selectedHobbies)
    if (state.data?.currentStep === 'notifications') setStep('notifications')
    if (state.data?.currentStep === 'confirm') setStep('confirm')
  }, [state.data])

  const updateStep = api.onboarding.updateStep.useMutation()
  const complete = api.onboarding.complete.useMutation({
    onSuccess: () => {
      router.push(selected.length > 0 ? `/items/new?type=${selected[0]}` : '/dashboard')
    },
  })

  function toggle(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function handleContinue() {
    updateStep.mutate({ currentStep: 'notifications', selectedHobbies: selected })
    setStep('notifications')
  }

  function handleNotificationsContinue() {
    upsertPref.mutate({ emailEnabled })
    updateStep.mutate({ currentStep: 'confirm', selectedHobbies: selected })
    setStep('confirm')
  }

  function copyFeedUrl() {
    if (!calendarToken.data?.feedUrl) return
    navigator.clipboard.writeText(calendarToken.data.feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <div className="w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4 shadow-lg shadow-primary/25">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to Wrenchly</h1>
        </div>

        {step === 'hobbies' && (
          <Card className="shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">What do you want to track?</CardTitle>
              <CardDescription>Pick as many as you like — you can always add more later.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {HOBBIES.map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => toggle(h.value)}
                    className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                      selected.includes(h.value)
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
              <Button className="w-full" disabled={updateStep.isPending} onClick={handleContinue}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'notifications' && (
          <Card className="shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Stay on top of it</CardTitle>
              <CardDescription>
                Turn on email, subscribe to the calendar, or both — pick whatever fits you. You can always change this later in Settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email notifications</Label>
                  <p className="text-xs text-muted-foreground">Reminders via email</p>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Calendar Integration
                </Label>
                <p className="text-xs text-muted-foreground">
                  Subscribe to your reminders in Google Calendar, Apple Calendar, or Outlook
                </p>
                {calendarToken.isLoading ? (
                  <div className="h-9 rounded-md bg-muted animate-pulse" />
                ) : (
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={calendarToken.data?.feedUrl ?? ''}
                      className="font-mono text-xs bg-muted"
                    />
                    <Button variant="outline" size="icon" onClick={copyFeedUrl} aria-label="Copy URL">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {upsertPref.error && <p className="text-sm text-destructive">{upsertPref.error.message}</p>}
              <Button className="w-full" disabled={updateStep.isPending || upsertPref.isPending} onClick={handleNotificationsContinue}>
                Continue
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep('hobbies')}>Back</Button>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <Card className="shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">You&apos;re all set</CardTitle>
              <CardDescription>
                {selected.length > 0
                  ? `Great — let's start tracking your ${selected.length === 1 ? 'thing' : 'things'}.`
                  : 'You can add items of any type at any time.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {complete.error && <p className="text-sm text-destructive">{complete.error.message}</p>}
              <Button
                className="w-full"
                disabled={complete.isPending}
                onClick={() => complete.mutate({ selectedHobbies: selected })}
              >
                {complete.isPending ? 'Finishing…' : 'Get started'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep('notifications')}>Back</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
