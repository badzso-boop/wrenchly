export type TriggerType = 'DATE' | 'INTERVAL_DAYS' | 'ODOMETER' | 'CRON' | 'WEATHER' | 'COMPOUND'

export interface DateTriggerConfig {
  type: 'DATE'
  date: string // ISO string
}

export interface IntervalDaysTriggerConfig {
  type: 'INTERVAL_DAYS'
  days: number
}

export interface OdometerTriggerConfig {
  type: 'ODOMETER'
  every_km: number
  last_done_at_km: number
}

export interface CronTriggerConfig {
  type: 'CRON'
  expression: string
  label?: string
}

export interface WeatherTriggerConfig {
  type: 'WEATHER'
  condition: 'temp_above' | 'frost_warning' | 'no_rain_48h' | 'last_frost_passed'
  value?: number
  days?: number
}

export type TriggerConfig =
  | DateTriggerConfig
  | IntervalDaysTriggerConfig
  | OdometerTriggerConfig
  | CronTriggerConfig
  | WeatherTriggerConfig

export interface Reminder {
  id: string
  itemId: string
  userId: string
  title: string
  description: string | null
  triggerType: TriggerType
  triggerConfig: TriggerConfig
  lastTriggeredAt: Date | null
  nextTriggerAt: Date | null
  isActive: boolean
  notifyChannels: string[]
  snoozeUntil: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateReminderInput {
  itemId: string
  title: string
  triggerType: TriggerType
  triggerConfig: TriggerConfig
  description?: string
  notifyChannels?: string[]
}

export interface UpdateReminderInput {
  title?: string
  description?: string
  triggerType?: TriggerType
  triggerConfig?: TriggerConfig
  isActive?: boolean
  notifyChannels?: string[]
  snoozeUntil?: Date | null
}
