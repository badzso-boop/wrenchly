import { View, Text, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { api } from '~/lib/trpc'
import { signOut } from '~/lib/auth'

export default function SettingsScreen() {
  const user = api.user.getMe.useQuery()

  async function handleSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold mb-4">Settings</Text>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-xs text-gray-500 mb-1">Name</Text>
          <Text className="font-medium mb-3">{user.data?.name ?? '—'}</Text>
          <Text className="text-xs text-gray-500 mb-1">Email</Text>
          <Text className="font-medium">{user.data?.email ?? '—'}</Text>
        </View>

        <Pressable
          className="bg-white border border-red-200 rounded-lg py-3 items-center"
          onPress={handleSignOut}
        >
          <Text className="text-red-600 font-semibold">Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
