'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth/client'
import { api } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const updateUsername = api.user.updateUsername.useMutation()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUsernameError(null)

    const trimmedUsername = username.trim().toLowerCase()
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      setUsernameError('3-20 characters: lowercase letters, numbers, underscore only')
      return
    }

    setLoading(true)
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: name.trim() || email.split('@')[0]!,
    })
    if (error) { setError(error.message ?? 'Registration failed'); setLoading(false); return }

    // The account exists at this point even if the username save below
    // fails (e.g. taken) - don't block onboarding on it, just let the user
    // pick a different one later in Settings.
    try {
      await updateUsername.mutateAsync({ username: trimmedUsername })
    } catch {
      // non-fatal, see comment above
    }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4 shadow-lg shadow-primary/25">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Wrenchly</h1>
          <p className="text-sm text-muted-foreground mt-1">Maintenance tracker for makers</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Create account</CardTitle>
            <CardDescription>Start tracking your equipment for free</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Your name" autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => { setUsername((e.target as HTMLInputElement).value.toLowerCase()); setUsernameError(null) }}
                    placeholder="yourname"
                    className="pl-7"
                    maxLength={20}
                    required
                    autoComplete="username"
                  />
                </div>
                {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                <p className="text-xs text-muted-foreground">Lets friends find you later — lowercase letters, numbers, underscore.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="you@example.com" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password" />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Already have an account?&nbsp;
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
