export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export function getMealTypeLabel(mealType: MealType): string {
  const labels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack'
  }
  return labels[mealType]
}