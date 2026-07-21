import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const TOKEN_KEY = 'wrenchly_session_token'

export function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

async function storeToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

interface AuthResult {
  error: string | null
}

async function callAuthEndpoint(path: string, body: Record<string, string>): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as { token?: string; message?: string } | null
  if (!res.ok || !data?.token) {
    return { error: data?.message ?? 'Authentication failed' }
  }
  await storeToken(data.token)
  return { error: null }
}

// Server issues a session token in the response body (Authorization: Bearer <token> on
// subsequent requests); see the `bearer` plugin in apps/web/src/lib/auth/auth.ts.
export function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  return callAuthEndpoint('sign-in/email', { email, password })
}

export function signUpWithPassword(email: string, password: string, name: string): Promise<AuthResult> {
  return callAuthEndpoint('sign-up/email', { email, password, name })
}

export async function signOut(): Promise<void> {
  const token = await getStoredToken()
  if (token) {
    await fetch(`${API_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
