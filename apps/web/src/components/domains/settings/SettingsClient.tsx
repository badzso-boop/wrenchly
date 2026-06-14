'use client'
import { api } from '@/lib/trpc/client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

const TIMEZONES = [
  'Europe/Budapest', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
]

export function SettingsClient() {
  const user = api.user.getMe.useQuery()
  const notifPref = api.user.getNotifPref.useQuery()
  const calendarToken = api.user.getOrCreateCalendarToken.useQuery()
  const regenerateToken = api.user.regenerateCalendarToken.useMutation({
    onSuccess: () => { calendarToken.refetch(); toast.success('Calendar link regenerated') },
  })
  const updateUser = api.user.update.useMutation({ onSuccess: () => { user.refetch(); toast.success('Profile saved') } })
  const upsertPref = api.user.upsertNotifPref.useMutation({ onSuccess: () => { notifPref.refetch(); toast.success('Preferences saved') } })

  const [copied, setCopied] = useState(false)

  function copyFeedUrl() {
    if (!calendarToken.data?.feedUrl) return
    navigator.clipboard.writeText(calendarToken.data.feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [name, setName] = useState('')
  const [locale, setLocale] = useState<'en' | 'hu'>('en')
  const [timezone, setTimezone] = useState('Europe/Budapest')
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [advanceDays, setAdvanceDays] = useState('3')
  const [quietFrom, setQuietFrom] = useState('')
  const [quietTo, setQuietTo] = useState('')
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  useEffect(() => {
    if (user.data) {
      setName(user.data.name ?? '')
      setLocale((user.data.locale as 'en' | 'hu') ?? 'en')
      setTimezone(user.data.timezone ?? 'Europe/Budapest')
    }
  }, [user.data])

  useEffect(() => {
    if (notifPref.data) {
      setPushEnabled(notifPref.data.pushEnabled)
      setEmailEnabled(notifPref.data.emailEnabled)
      setAdvanceDays(notifPref.data.advanceDays.toString())
      setQuietFrom(notifPref.data.quietHoursFrom?.toString() ?? '')
      setQuietTo(notifPref.data.quietHoursTo?.toString() ?? '')
      setWeeklyDigest(notifPref.data.weeklyDigest)
    }
  }, [notifPref.data])

  if (user.isLoading) return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4"><Skeleton className="h-8 w-32" /></div>
      <div className="px-6 py-6 max-w-lg mx-auto w-full space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 animate-in fade-in-0 duration-300">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Profile */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.data?.email ?? ''} disabled className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={locale} onValueChange={(v) => { if (v !== null) setLocale(v as 'en' | 'hu') }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hu">Magyar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={(v) => { if (v !== null) setTimezone(v) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={updateUser.isPending}
                onClick={() => updateUser.mutate({ name: name || undefined, locale, timezone })}
              >
                {updateUser.isPending ? 'Saving…' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>How and when you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push notifications</Label>
                  <p className="text-xs text-muted-foreground">Mobile app alerts</p>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email notifications</Label>
                  <p className="text-xs text-muted-foreground">Reminders via email</p>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly digest</Label>
                  <p className="text-xs text-muted-foreground">Summary every Monday</p>
                </div>
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Remind N days before due</Label>
                <Input type="number" value={advanceDays} onChange={(e) => setAdvanceDays((e.target as HTMLInputElement).value)} min="0" max="30" className="w-24" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quiet hours from</Label>
                  <Select value={quietFrom || 'none'} onValueChange={(v) => { if (v !== null) setQuietFrom(v === 'none' ? '' : v) }}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quiet hours to</Label>
                  <Select value={quietTo || 'none'} onValueChange={(v) => { if (v !== null) setQuietTo(v === 'none' ? '' : v) }}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={upsertPref.isPending}
                onClick={() => upsertPref.mutate({
                  pushEnabled, emailEnabled, advanceDays: Number(advanceDays),
                  quietHoursFrom: quietFrom ? Number(quietFrom) : null,
                  quietHoursTo: quietTo ? Number(quietTo) : null,
                  weeklyDigest,
                })}
              >
                {upsertPref.isPending ? 'Saving…' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
          {/* Calendar Integration */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Calendar Integration
              </CardTitle>
              <CardDescription>
                Subscribe to your reminders in Google Calendar, Apple Calendar, or Outlook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {calendarToken.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Your calendar feed URL</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Paste this URL into Google Calendar → Other calendars → From URL
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Regenerate link</p>
                      <p className="text-xs text-muted-foreground">Invalidates the old URL</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={regenerateToken.isPending}
                      onClick={() => { if (window.confirm('This will invalidate your old calendar URL. Continue?')) regenerateToken.mutate() }}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1 ${regenerateToken.isPending ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </div>
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground">
                      Works with: Google Calendar · Apple Calendar · Outlook · Any .ics app
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
