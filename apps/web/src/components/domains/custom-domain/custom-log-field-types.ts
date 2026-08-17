import {
  Type,
  AlignLeft,
  Hash,
  Percent,
  Calendar,
  Clock,
  ToggleLeft,
  ChevronDownSquare,
  CircleDot,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react'
import type { FieldType } from '@prisma/client'

export interface LogFieldTypeDef {
  value: FieldType
  label: string
  icon: LucideIcon
  hasOptions: boolean
  hasMinMax: boolean
  hasDecimalPlaces: boolean
  hasMaxLength: boolean
  supportsRequired: boolean
}

// The 10 Log-tab widget types, in the order they appear in the "+" picker.
export const LOG_FIELD_TYPES: LogFieldTypeDef[] = [
  { value: 'TEXT', label: 'Text', icon: Type, hasOptions: false, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: true, supportsRequired: true },
  { value: 'LONG_TEXT', label: 'Long text', icon: AlignLeft, hasOptions: false, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: true, supportsRequired: true },
  { value: 'NUMBER', label: 'Number', icon: Hash, hasOptions: false, hasMinMax: true, hasDecimalPlaces: false, hasMaxLength: false, supportsRequired: true },
  { value: 'DECIMAL', label: 'Decimal', icon: Percent, hasOptions: false, hasMinMax: true, hasDecimalPlaces: true, hasMaxLength: false, supportsRequired: true },
  { value: 'DATE', label: 'Date', icon: Calendar, hasOptions: false, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: false, supportsRequired: true },
  { value: 'TIME', label: 'Time', icon: Clock, hasOptions: false, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: false, supportsRequired: true },
  { value: 'BOOLEAN', label: 'True / false', icon: ToggleLeft, hasOptions: false, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: false, supportsRequired: false },
  { value: 'ENUM', label: 'Dropdown', icon: ChevronDownSquare, hasOptions: true, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: false, supportsRequired: true },
  { value: 'RADIO', label: 'Radio buttons', icon: CircleDot, hasOptions: true, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: false, supportsRequired: true },
  { value: 'CHECKBOXES', label: 'Checkboxes', icon: CheckSquare, hasOptions: true, hasMinMax: false, hasDecimalPlaces: false, hasMaxLength: false, supportsRequired: true },
]

export function getLogFieldTypeDef(fieldType: FieldType): LogFieldTypeDef {
  return LOG_FIELD_TYPES.find((t) => t.value === fieldType) ?? LOG_FIELD_TYPES[0]!
}
