import { View, Text, ScrollView } from 'react-native'
import { api } from '@/lib/trpc'

export default function DashboardScreen() {
  const items = api.item.list.useQuery({})

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold mb-4">Dashboard</Text>
        {items.isLoading && <Text className="text-gray-500">Loading...</Text>}
        {items.data?.map((item) => (
          <View key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <Text className="font-semibold text-lg">{item.name}</Text>
            <Text className="text-gray-500 text-sm">{item.type}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
