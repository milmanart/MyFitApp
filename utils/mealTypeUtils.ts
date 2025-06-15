// Utility functions for dynamic meal type assignment
import type { Entry } from '../services/firebaseService'

/**
 * Example scenarios for meal type assignment with time-based rules:
 * 
 * Rules:
 * - Meals before 15:00 (3 PM) cannot be dinner, even if they're the last meal
 * - If meal is before 15:00 and would be dinner, it becomes lunch instead
 * - If lunch already exists and there's a meal after lunch but before 15:00, it becomes snack
 * 
 * 1 meal: [breakfast]
 * 2 meals before 15:00: [breakfast, lunch]
 * 2 meals (one after 15:00): [breakfast, dinner]  
 * 3 meals: [breakfast, lunch, dinner]
 * 4 meals: [breakfast, snack, lunch, dinner] 
 * 5 meals: [breakfast, snack, lunch, snack, dinner]
 * 6 meals: [breakfast, snack, snack, lunch, snack, dinner]
 * 
 * Time constraint: No dinner before 15:00 (3 PM)
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

// Time window for grouping entries into the same meal (30 minutes)
const MEAL_TIME_WINDOW_MS = 30 * 60 * 1000 // 30 minutes in milliseconds

export function assignMealTypes(entries: Entry[]): Entry[] {
  if (entries.length === 0) return entries

  // Sort entries by time
  const sortedEntries = entries.sort((a, b) => {
    const timeA = new Date(a.dateTime).getTime()
    const timeB = new Date(b.dateTime).getTime()
    return timeA - timeB
  })

  // Group entries by time windows (30-minute rule)
  const timeGroups = groupEntriesByTimeWindow(sortedEntries)
  
  // Helper function to check if a time is before 15:00 (3 PM)
  const isBefore3PM = (dateTime: string): boolean => {
    const date = new Date(dateTime)
    return date.getHours() < 15
  }

  // Helper function to get the representative time for a group (first entry's time)
  const getGroupTime = (group: Entry[]): string => group[0].dateTime

  // Assign meal types to groups based on new rules
  const result = [...sortedEntries]
  
  if (timeGroups.length === 1) {
    // Single meal group -> all breakfast
    timeGroups[0].forEach(entry => {
      const index = result.findIndex(r => r.dateTime === entry.dateTime && r.name === entry.name)
      if (index >= 0) result[index] = { ...result[index], mealType: 'breakfast' }
    })
  } else if (timeGroups.length === 2) {
    // Two meal groups
    const lastGroupTime = getGroupTime(timeGroups[1])
    
    // First group is always breakfast
    timeGroups[0].forEach(entry => {
      const index = result.findIndex(r => r.dateTime === entry.dateTime && r.name === entry.name)
      if (index >= 0) result[index] = { ...result[index], mealType: 'breakfast' }
    })
    
    // Second group: if before 15:00, it's lunch; if after 15:00, it's dinner
    const secondMealType = isBefore3PM(lastGroupTime) ? 'lunch' : 'dinner'
    timeGroups[1].forEach(entry => {
      const index = result.findIndex(r => r.dateTime === entry.dateTime && r.name === entry.name)
      if (index >= 0) result[index] = { ...result[index], mealType: secondMealType }
    })
  } else {
    // 3+ meal groups
    // First group is always breakfast
    timeGroups[0].forEach(entry => {
      const index = result.findIndex(r => r.dateTime === entry.dateTime && r.name === entry.name)
      if (index >= 0) result[index] = { ...result[index], mealType: 'breakfast' }
    })
    
    // Find the last group that could be dinner (after 15:00)
    let dinnerGroupIndex = -1
    for (let i = timeGroups.length - 1; i >= 1; i--) {
      if (!isBefore3PM(getGroupTime(timeGroups[i]))) {
        dinnerGroupIndex = i
        break
      }
    }
    
    // If we found a dinner group, assign it
    if (dinnerGroupIndex >= 0) {
      timeGroups[dinnerGroupIndex].forEach(entry => {
        const index = result.findIndex(r => r.dateTime === entry.dateTime && r.name === entry.name)
        if (index >= 0) result[index] = { ...result[index], mealType: 'dinner' }
      })
    }
    
    // Find a good candidate for lunch (middle group, but not dinner)
    let lunchGroupIndex = -1
    if (timeGroups.length === 3 && dinnerGroupIndex === 2) {
      // 3 groups with dinner -> middle is lunch
      lunchGroupIndex = 1
    } else if (timeGroups.length > 3) {
      // Find middle group that's not breakfast or dinner
      const availableGroups = []
      for (let i = 1; i < timeGroups.length; i++) {
        if (i !== dinnerGroupIndex) {
          availableGroups.push(i)
        }
      }
      if (availableGroups.length > 0) {
        if (availableGroups.length > 1) {
          // Multiple groups between breakfast and dinner - select the one with highest calories for lunch
          let maxCalories = 0
          let highestCalorieGroupIndex = availableGroups[0]
          
          availableGroups.forEach(groupIndex => {
            const groupCalories = timeGroups[groupIndex].reduce((sum, entry) => sum + entry.calories, 0)
            if (groupCalories > maxCalories) {
              maxCalories = groupCalories
              highestCalorieGroupIndex = groupIndex
            }
          })
          
          lunchGroupIndex = highestCalorieGroupIndex
        } else {
          // Only one group between breakfast and dinner - it becomes lunch
          lunchGroupIndex = availableGroups[0]
        }
      }
    }
    
    // If no dinner was assigned (all meals before 15:00), the last group becomes lunch
    if (dinnerGroupIndex === -1 && timeGroups.length >= 2) {
      lunchGroupIndex = timeGroups.length - 1
    }
    
    // Assign lunch if we found a group for it
    if (lunchGroupIndex >= 0) {
      timeGroups[lunchGroupIndex].forEach(entry => {
        const index = result.findIndex(r => r.dateTime === entry.dateTime && r.name === entry.name)
        if (index >= 0) result[index] = { ...result[index], mealType: 'lunch' }
      })
    }
    
    // All remaining groups are snacks
    timeGroups.forEach((group, groupIndex) => {
      if (groupIndex !== 0 && groupIndex !== dinnerGroupIndex && groupIndex !== lunchGroupIndex) {
        group.forEach(entry => {
          const index = result.findIndex(r => r.dateTime === entry.dateTime && r.name === entry.name)
          if (index >= 0) result[index] = { ...result[index], mealType: 'snack' }
        })
      }
    })
  }

  return result
}

function groupEntriesByTimeWindow(entries: Entry[]): Entry[][] {
  if (entries.length === 0) return []

  const groups: Entry[][] = []
  let currentGroup: Entry[] = [entries[0]]

  for (let i = 1; i < entries.length; i++) {
    const currentTime = new Date(entries[i].dateTime).getTime()
    const lastGroupTime = new Date(currentGroup[currentGroup.length - 1].dateTime).getTime()
    
    // If within 30 minutes of the last entry in current group, add to current group
    if (currentTime - lastGroupTime <= MEAL_TIME_WINDOW_MS) {
      currentGroup.push(entries[i])
    } else {
      // Start new group
      groups.push(currentGroup)
      currentGroup = [entries[i]]
    }
  }
  
  // Add the last group
  groups.push(currentGroup)
  
  return groups
}

export function getMealTypeLabel(mealType: MealType): string {
  const labels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack'
  }
  return labels[mealType]
}

export function getMealTypeOrder(): MealType[] {
  return ['breakfast', 'snack', 'lunch', 'snack', 'dinner']
}