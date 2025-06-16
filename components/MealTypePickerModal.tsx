import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native'
import { useTheme } from '../navigation/ThemeContext'
import { type MealType, getMealTypeLabel } from '../utils/mealTypeUtils'
import { useResponsiveDimensions } from '../hooks/useResponsiveDimensions'

interface MealTypePickerModalProps {
  isVisible: boolean
  onClose: () => void
  selectedMealType: MealType
  onMealTypeSelect: (mealType: MealType) => void
}

const MEAL_TYPE_OPTIONS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealTypePickerModal({
  isVisible,
  onClose,
  selectedMealType,
  onMealTypeSelect,
}: MealTypePickerModalProps) {
  const { theme } = useTheme()
  const { modalWidth, isTablet } = useResponsiveDimensions()

  const handleMealTypeSelect = (mealType: MealType) => {
    onMealTypeSelect(mealType)
    onClose()
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modal, 
          { 
            backgroundColor: theme.cardBackground,
            width: modalWidth,
            maxWidth: isTablet ? 400 : 320
          }
        ]}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            Select Meal Type
          </Text>
          
          {MEAL_TYPE_OPTIONS.map((mealType) => (
            <TouchableOpacity
              key={mealType}
              style={[
                styles.option,
                {
                  backgroundColor: selectedMealType === mealType 
                    ? theme.primary + '20' 
                    : 'transparent',
                },
              ]}
              onPress={() => handleMealTypeSelect(mealType)}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: selectedMealType === mealType 
                      ? theme.primary 
                      : theme.textColor,
                    fontWeight: selectedMealType === mealType ? 'bold' : 'normal',
                  },
                ]}
              >
                {getMealTypeLabel(mealType)}
              </Text>
              {selectedMealType === mealType && (
                <Text style={{ color: theme.primary, fontSize: 16 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 12,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
  },
})