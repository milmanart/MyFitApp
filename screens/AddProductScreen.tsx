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
  ScrollView,
} from 'react-native'
import { OfflineDataService } from '../services/offlineDataService'
import type { Entry } from '../services/firebaseService'
import { useTheme } from '../navigation/ThemeContext'
import { successHaptic, lightHaptic } from '../utils/hapticUtils'
import { showValidationError, handleNetworkError, withRetry, showSuccess } from '../utils/errorUtils'
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import DatePickerModal from '../components/DatePickerModal'
import TimePickerModal from '../components/TimePickerModal'
import MealTypePickerModal from '../components/MealTypePickerModal'
import { useResponsiveDimensions } from '../hooks/useResponsiveDimensions'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: { entry?: Entry; suggestedDateTime?: string; targetMealType?: string; addToExistingMeal?: boolean }
  ProductInfo: { entry: Entry }
}

type Props = NativeStackScreenProps<RootStackParamList, 'AddProduct'>

import { getMealTypeLabel, type MealType } from '../utils/mealTypeUtils'

export default function AddProductScreen({ navigation, route }: Props) {
  const { theme } = useTheme()
  const { containerPadding, maxContentWidth, isLandscape } = useResponsiveDimensions()
  const editingEntry = route.params?.entry
  const suggestedDateTime = route.params?.suggestedDateTime
  const targetMealType = route.params?.targetMealType
  const addToExistingMeal = route.params?.addToExistingMeal
  const isEditing = !!editingEntry

  const [name, setName] = useState(editingEntry?.name || '')
  const [calories, setCalories] = useState(editingEntry?.calories.toString() || '')
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    editingEntry?.mealType || 'breakfast'
  )
  
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
  const [mealTypePickerVisible, setMealTypePickerVisible] = useState(false)

  const onSavePress = async () => {
    if (!name.trim() || !calories.trim()) {
      await showValidationError('Please fill in all fields')
      return
    }
    const calNumber = Number(calories)
    if (isNaN(calNumber) || calNumber <= 0) {
      await showValidationError('Calories must be a positive number')
      return
    }

    try {
      // Combine selected date with selected time
      const combinedDateTime = new Date(selectedDate)
      combinedDateTime.setHours(selectedTime.hour, selectedTime.minute, 0, 0)

      // Use offline-capable data service
      if (isEditing && editingEntry?.id) {
        const updates = {
          name: name.trim(),
          mealType: selectedMealType,
          dateTime: combinedDateTime.toISOString(),
          calories: calNumber,
        }
        await OfflineDataService.updateEntry(editingEntry.id, updates)
      } else {
        const newEntry = {
          name: name.trim(),
          mealType: selectedMealType,
          dateTime: combinedDateTime.toISOString(),
          calories: calNumber,
        }
        await OfflineDataService.addEntry(newEntry)
      }

      await successHaptic()
      showSuccess(isEditing ? 'Entry updated successfully' : 'Entry saved successfully')
      navigation.navigate('Home')
    } catch (error) {
      console.error('Error saving entry:', error)
      await handleNetworkError(error, 'Failed to save entry. Please try again.')
    }
  }

  const onCancelPress = async () => {
    await lightHaptic() // Light vibration for cancel
    navigation.goBack()
  }

  // Remove meal type selection components

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: containerPadding,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%',
          paddingBottom: 20, // Extra padding at bottom
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.textColor, marginTop: 20 }]}>
          {isEditing ? 'Edit Meal Entry' : 'Add Meal Entry'}
        </Text>

      {/* Date */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: isLandscape ? 12 : 16 }]}>
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
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: isLandscape ? 12 : 16 }]}>
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

      {/* Meal Type */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: isLandscape ? 12 : 16 }]}>
        Meal Type
      </Text>
      <TouchableOpacity
        onPress={() => setMealTypePickerVisible(true)}
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
          {getMealTypeLabel(selectedMealType)}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 20 }}>🍽️</Text>
      </TouchableOpacity>

      {/* Food Name */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: isLandscape ? 12 : 16 }]}>
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
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: isLandscape ? 12 : 16 }]}>
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
      <View style={[
        localStyles.buttonRow, 
        { 
          marginTop: isLandscape ? 24 : 32,
          marginBottom: isLandscape ? 16 : 24,
          paddingHorizontal: isLandscape ? 0 : 0,
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.loginButton, 
            localStyles.cancelButton, 
            { 
              flex: 1, 
              marginRight: 8,
              minHeight: isLandscape ? 44 : 48
            }
          ]}
          onPress={onCancelPress}
        >
          <Text style={styles.loginButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.loginButton, 
            { 
              flex: 1, 
              marginLeft: 8,
              minHeight: isLandscape ? 44 : 48
            }
          ]}
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

      {/* Meal Type Picker Modal */}
      <MealTypePickerModal
        isVisible={mealTypePickerVisible}
        onClose={() => setMealTypePickerVisible(false)}
        selectedMealType={selectedMealType}
        onMealTypeSelect={setSelectedMealType}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const localStyles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: 16, // Modern spacing between buttons
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#888', // gray background for Cancel button
  },
})
