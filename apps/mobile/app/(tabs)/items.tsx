import { View, Text, ScrollView, Pressable } from 'react-native'
import { api } from '~/lib/trpc'
import { router } from 'expo-router'

export default function ItemsScreen() {
  const items = api.item.list.useQuery({})

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold">My Items</Text>
          <Pressable
            className="bg-blue-600 px-4 py-2 rounded-lg"
            onPress={() => router.push('/items/new')}
          >
            <Text className="text-white font-medium">Add</Text>
          </Pressable>
        </View>
        {items.isLoading && <Text className="text-gray-500">Loading...</Text>}
        {items.data?.map((item) => (
          <Pressable
            key={item.id}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            onPress={() => router.push(`/items/${item.id}`)}
          >
            <Text className="font-semibold text-lg">{item.name}</Text>
            <Text className="text-gray-500 text-sm capitalize">{item.type.toLowerCase()}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
