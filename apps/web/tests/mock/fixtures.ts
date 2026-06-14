export const TEST_ITEMS = [
  {
    id: 'mock-item-1',
    userId: 'mock-user',
    name: 'Toyota Corolla',
    type: 'VEHICLE',
    status: 'ACTIVE',
    description: 'Daily driver',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-item-2',
    userId: 'mock-user',
    name: 'Husqvarna Lawn Mower',
    type: 'EQUIPMENT',
    status: 'ACTIVE',
    description: null,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]

export const TEST_MAINTENANCE = [
  {
    id: 'mock-maint-1',
    itemId: 'mock-item-1',
    title: 'Oil Change',
    category: 'OIL_CHANGE',
    performedAt: '2024-03-01T00:00:00.000Z',
    odometerValue: '55000',
    notes: 'Castrol 5W-30',
    parts: [{ id: 'p1', name: 'Oil Filter', quantity: 1, unit: 'pcs', unitPrice: '2500' }],
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'mock-maint-2',
    itemId: 'mock-item-1',
    title: 'Brake Pads',
    category: 'BRAKES',
    performedAt: '2024-01-10T00:00:00.000Z',
    odometerValue: '52000',
    notes: null,
    parts: [],
    createdAt: '2024-01-10T00:00:00.000Z',
  },
]

export const TEST_REMINDERS = [
  {
    id: 'mock-rem-1',
    itemId: 'mock-item-1',
    title: 'Oil Change Due',
    triggerType: 'INTERVAL_DAYS',
    triggerConfig: { days: 90 },
    isActive: true,
    nextDueAt: '2024-06-01T00:00:00.000Z',
    lastTriggeredAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

export const TEST_INVENTORY = [
  {
    id: 'mock-inv-1',
    userId: 'mock-user',
    name: 'Castrol Edge 5W-30',
    category: 'Oil & Fluids',
    quantity: '4',
    unit: 'L',
    minQuantity: '2',
    location: 'Shelf A1',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'mock-inv-2',
    userId: 'mock-user',
    name: 'Oil Filter',
    category: 'Filters',
    quantity: '1',
    unit: 'pcs',
    minQuantity: '2',
    location: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

export const TEST_VEHICLE = {
  id: 'mock-veh-1',
  itemId: 'mock-item-1',
  make: 'Toyota',
  model: 'Corolla',
  year: 2019,
  vin: null,
  fuelType: 'Petrol',
  engineDisplacement: 1600,
  licensePlate: 'ABC-123',
  color: 'Silver',
  currentOdometer: '58000',
  createdAt: '2024-01-01T00:00:00.000Z',
}

export const TEST_CALENDAR_TOKEN = {
  token: 'mock-calendar-token-abc123def456',
  feedUrl: 'http://localhost:3000/api/calendar/mock-calendar-token-abc123def456/feed.ics',
}

export const TEST_NOTIFICATIONS = [
  {
    id: 'mock-notif-1',
    userId: 'mock-user',
    reminderId: 'mock-rem-1',
    titleKey: 'Oil Change Due',
    bodyKey: 'Toyota Corolla oil change is due',
    bodyParams: null,
    channel: 'push',
    actionUrl: null,
    readAt: null,
    snoozedUntil: null,
    triggeredAt: '2024-06-01T00:00:00.000Z',
  },
]
