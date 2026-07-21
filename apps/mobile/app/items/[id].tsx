import { View, Text, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { api } from '@/lib/trpc'

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const item = api.item.getById.useQuery({ id })
  const reminders = api.reminder.getByItemId.useQuery({ itemId: id })

  if (item.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Loading…</Text>
      </View>
    )
  }

  if (!item.data) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Item not found.</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold">{item.data.name}</Text>
        <Text className="text-gray-500 text-sm capitalize mb-6">{item.data.type.toLowerCase()}</Text>

        {(item.data.brand ?? item.data.model) && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-xs text-gray-500 mb-1">Brand / Model</Text>
            <Text className="font-medium">{[item.data.brand, item.data.model].filter(Boolean).join(' ')}</Text>
          </View>
        )}

        <Text className="text-lg font-semibold mb-2">Reminders</Text>
        {reminders.isLoading && <Text className="text-gray-500">Loading…</Text>}
        {reminders.data?.length === 0 && (
          <Text className="text-gray-500 text-sm">No reminders for this item yet.</Text>
        )}
        {reminders.data?.map((r) => (
          <View key={r.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <Text className="font-semibold">{r.title}</Text>
            <Text className="text-gray-500 text-xs capitalize">{r.triggerType.toLowerCase().replace('_', ' ')}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
