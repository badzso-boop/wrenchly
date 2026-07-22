import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { api } from '~/lib/trpc'
import type { ItemType } from '@wrenchly/types'

const ITEM_TYPES: ItemType[] = [
  'VEHICLE', 'PROPERTY', 'PLANT', 'PET', 'BICYCLE', 'PRINTER_3D',
  'AQUARIUM', 'POOL', 'BOAT', 'DRONE', 'INSTRUMENT', 'SOLAR', 'CUSTOM',
]

export default function NewItemScreen() {
  const [name, setName] = useState('')
  const [type, setType] = useState<ItemType>('VEHICLE')
  const utils = api.useUtils()

  const create = api.item.create.useMutation({
    onSuccess: (item) => {
      utils.item.list.invalidate()
      router.replace(`/items/${item.id}`)
    },
    onError: (err) => Alert.alert('Could not create item', err.message),
  })

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-4 py-6">
        <Text className="text-2xl font-bold mb-6">New item</Text>

        <Text className="text-sm text-gray-500 mb-1">Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 bg-white"
          placeholder="e.g. Ford Focus"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-sm text-gray-500 mb-2">Type</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {ITEM_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`px-3 py-2 rounded-lg border ${type === t ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
            >
              <Text className={type === t ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                {t.replace('_', ' ').toLowerCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          className="bg-blue-600 rounded-lg py-3 items-center"
          disabled={!name || create.isPending}
          onPress={() => create.mutate({ name, type })}
        >
          <Text className="text-white font-semibold text-base">
            {create.isPending ? 'Creating…' : 'Create item'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
