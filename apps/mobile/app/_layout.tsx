import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { api, createTRPCClient } from '~/lib/trpc'
import { getStoredToken } from '~/lib/auth'
import '../global.css'

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() => createTRPCClient())
  const [checkedAuth, setCheckedAuth] = useState(false)

  useEffect(() => {
    getStoredToken().then((token) => {
      router.replace(token ? '/(tabs)' : '/(auth)/login')
      setCheckedAuth(true)
    })
  }, [])

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {checkedAuth ? (
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        ) : (
          <View className="flex-1 bg-white" />
        )}
      </QueryClientProvider>
    </api.Provider>
  )
}
