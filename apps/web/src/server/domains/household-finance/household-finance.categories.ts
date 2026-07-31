export interface HouseholdFinanceCategoryDef {
  value: string
  label: string
}

// Free-form strings, not a DB enum (same convention as maintenance.category /
// PrintJob.materialType) — categories can grow without a migration. Split by transaction
// direction since "Salary" makes no sense on an expense and "Groceries" makes no sense on
// income.
export const EXPENSE_CATEGORIES: HouseholdFinanceCategoryDef[] = [
  { value: 'GROCERY', label: 'Grocery' },
  { value: 'FOOD_DELIVERY', label: 'Food delivery' },
  { value: 'HOUSEHOLD_ITEM', label: 'Household item' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'OTHER', label: 'Other' },
]

export const INCOME_CATEGORIES: HouseholdFinanceCategoryDef[] = [
  { value: 'SALARY', label: 'Salary' },
  { value: 'SIDE_INCOME', label: 'Side income' },
  { value: 'GIFT', label: 'Gift' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'SALE', label: 'Sale' },
  { value: 'OTHER', label: 'Other' },
]

export function getCategoriesFor(type: 'EXPENSE' | 'INCOME'): HouseholdFinanceCategoryDef[] {
  return type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
}

export function isValidCategory(type: 'EXPENSE' | 'INCOME', category: string): boolean {
  return getCategoriesFor(type).some((c) => c.value === category)
}
