import { View, Text, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { api } from '@/lib/trpc'

export default function RemindersScreen() {
  const reminders = api.reminder.list.useQuery()

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold mb-4">Reminders</Text>

        {reminders.isLoading && <Text className="text-gray-500">Loading…</Text>}

        {reminders.data?.length === 0 && (
          <Text className="text-gray-500">No upcoming reminders.</Text>
        )}

        {reminders.data?.map((r) => (
          <Pressable
            key={r.id}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            onPress={() => router.push(`/items/${r.itemId}`)}
          >
            <Text className="font-semibold text-lg">{r.title}</Text>
            <Text className="text-gray-500 text-sm">{r.item.name}</Text>
            {r.nextTriggerAt && (
              <Text className="text-gray-400 text-xs mt-1">
                Due {new Date(r.nextTriggerAt).toLocaleDateString()}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
