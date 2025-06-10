// MyFitApp/screens/AddProductScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native'
import { addEntry, updateEntry, recalculateMealTypesForDate } from '../services/firebaseService'
import type { Entry } from '../services/firebaseService'
import { useTheme } from '../navigation/ThemeContext'
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import DatePickerModal from '../components/DatePickerModal'
import TimePickerModal from '../components/TimePickerModal'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: { entry?: Entry; suggestedDateTime?: string; targetMealType?: string; addToExistingMeal?: boolean }
  ProductInfo: { entry: Entry }
}

type Props = NativeStackScreenProps<RootStackParamList, 'AddProduct'>

// Note: Meal types are now assigned automatically based on time

export default function AddProductScreen({ navigation, route }: Props) {
  const { theme } = useTheme()
  const editingEntry = route.params?.entry
  const suggestedDateTime = route.params?.suggestedDateTime
  const targetMealType = route.params?.targetMealType
  const addToExistingMeal = route.params?.addToExistingMeal
  const isEditing = !!editingEntry

  const [name, setName] = useState(editingEntry?.name || '')
  const [calories, setCalories] = useState(editingEntry?.calories.toString() || '')
  
  // Initialize date and time based on editing entry or suggested values
  const [selectedDate, setSelectedDate] = useState(() => {
    if (editingEntry) {
      return new Date(editingEntry.dateTime)
    }
    if (suggestedDateTime) {
      return new Date(suggestedDateTime)
    }
    return new Date()
  })
  
  const [selectedTime, setSelectedTime] = useState(() => {
    if (editingEntry) {
      const date = new Date(editingEntry.dateTime)
      return { hour: date.getHours(), minute: date.getMinutes() }
    }
    if (suggestedDateTime) {
      const date = new Date(suggestedDateTime)
      return { hour: date.getHours(), minute: date.getMinutes() }
    }
    // Default to current time
    const now = new Date()
    return { hour: now.getHours(), minute: now.getMinutes() }
  })

  // Update initial values when route params change
  useEffect(() => {
    if (editingEntry) {
      const entryDate = new Date(editingEntry.dateTime)
      setSelectedDate(entryDate)
      setSelectedTime({ 
        hour: entryDate.getHours(), 
        minute: entryDate.getMinutes() 
      })
    } else if (suggestedDateTime) {
      const suggestedDate = new Date(suggestedDateTime)
      setSelectedDate(suggestedDate)
      setSelectedTime({ 
        hour: suggestedDate.getHours(), 
        minute: suggestedDate.getMinutes() 
      })
    }
  }, [editingEntry, suggestedDateTime])
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [timePickerVisible, setTimePickerVisible] = useState(false)

  const onSavePress = async () => {
    if (!name.trim() || !calories.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    const calNumber = Number(calories)
    if (isNaN(calNumber) || calNumber <= 0) {
      Alert.alert('Error', 'Calories must be a positive number')
      return
    }

    try {
      // Combine selected date with selected time
      const combinedDateTime = new Date(selectedDate)
      combinedDateTime.setHours(selectedTime.hour, selectedTime.minute, 0, 0)

      if (isEditing && editingEntry?.id) {
        const updates = {
          name: name.trim(),
          mealType: editingEntry?.mealType || 'breakfast', // Keep existing mealType for editing
          dateTime: combinedDateTime.toISOString(),
          calories: calNumber,
        }
        await updateEntry(editingEntry.id, updates)
        // Recalculate meal types for the date after editing
        await recalculateMealTypesForDate(combinedDateTime)
      } else {
        const newEntry = {
          name: name.trim(),
          mealType: 'breakfast', // Temporary, will be recalculated
          dateTime: combinedDateTime.toISOString(),
          calories: calNumber,
        }
        await addEntry(newEntry)
        // Recalculate meal types for the date after adding
        await recalculateMealTypesForDate(combinedDateTime)
      }

      navigation.navigate('Home')
    } catch (error) {
      console.error('Error saving entry:', error)
      Alert.alert('Error', 'Failed to save entry')
    }
  }

  const onCancelPress = () => {
    navigation.goBack()
  }

  // Remove meal type selection components

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Text style={[styles.title, { color: theme.textColor }]}>
        {isEditing ? 'Edit Meal Entry' : 'Add Meal Entry'}
      </Text>

      {/* Date */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: 16 }]}>
        Date
      </Text>
      <TouchableOpacity
        onPress={() => setDatePickerVisible(true)}
        style={[
          styles.pickerContainer,
          {
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
          },
        ]}
      >
        <Text style={{ color: theme.textColor, fontSize: 16 }}>
          {selectedDate.toLocaleDateString()}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 20 }}>📅</Text>
      </TouchableOpacity>

      {/* Time */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: 16 }]}>
        Time
      </Text>
      <TouchableOpacity
        onPress={() => setTimePickerVisible(true)}
        style={[
          styles.pickerContainer,
          {
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
          },
        ]}
      >
        <Text style={{ color: theme.textColor, fontSize: 16 }}>
          {`${selectedTime.hour.toString().padStart(2, '0')}:${selectedTime.minute.toString().padStart(2, '0')}`}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 20 }}>🕐</Text>
      </TouchableOpacity>

      {/* Meal Type Assignment Info */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: 16 }]}>
        Meal Type
      </Text>
      <View
        style={[
          styles.pickerContainer,
          {
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
            paddingHorizontal: 12,
            paddingVertical: 12,
          },
        ]}
      >
        <Text style={{ color: theme.textSecondary, fontSize: 14, fontStyle: 'italic' }}>
          {addToExistingMeal && targetMealType
            ? `Adding to existing ${targetMealType} meal`
            : targetMealType 
            ? `Creating new ${targetMealType} meal. Time can be adjusted.`
            : 'Meal type will be assigned automatically based on time'
          }
        </Text>
      </View>

      {/* Food Name */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: 16 }]}>
        Food Name
      </Text>
      <TextInput
        style={[
          styles.loginInput,
          {
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
            color: theme.textColor,
          },
        ]}
        placeholder="Enter food name"
        placeholderTextColor={theme.textSecondary}
        value={name}
        onChangeText={setName}
      />

      {/* Calories */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: 16 }]}>
        Calories
      </Text>
      <TextInput
        style={[
          styles.loginInput,
          {
            borderColor: theme.border,
            backgroundColor: theme.cardBackground,
            color: theme.textColor,
          },
        ]}
        placeholder="Enter calories"
        placeholderTextColor={theme.textSecondary}
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />

      {/* Buttons: Save and Cancel */}
      <View style={localStyles.buttonRow}>
        <TouchableOpacity
          style={[styles.loginButton, localStyles.cancelButton, { flex: 1, marginLeft: 8 }]}
          onPress={onCancelPress}
        >
          <Text style={styles.loginButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.loginButton, { flex: 1, marginRight: 8 }]}
          onPress={onSavePress}
        >
          <Text style={styles.loginButtonText}>{isEditing ? 'Update Entry' : 'Save Entry'}</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        isVisible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        isVisible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        selectedTime={selectedTime}
        onTimeSelect={setSelectedTime}
      />

      {/* Meal type selection modal removed */}
    </KeyboardAvoidingView>
  )
}

const localStyles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    marginTop: 32,
  },
  cancelButton: {
    backgroundColor: '#888', // gray background for Cancel button
  },
})
