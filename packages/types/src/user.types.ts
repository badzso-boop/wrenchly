export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  locale: string
  timezone: string
  expoPushToken: string | null
  defaultLat: number | null
  defaultLon: number | null
  createdAt: Date
  updatedAt: Date
}
