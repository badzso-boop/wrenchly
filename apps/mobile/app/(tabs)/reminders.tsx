import { View, Text, ScrollView } from 'react-native'

export default function RemindersScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold mb-4">Reminders</Text>
        <Text className="text-gray-500">Select an item to see its reminders.</Text>
      </View>
    </ScrollView>
  )
}
