// MyFitApp/screens/AddProductScreen.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../navigation/ThemeContext'
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'AddProduct'>

// Опции для выбора приёма пищи
const MEAL_OPTIONS: {
  label: string
  value: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch',     value: 'lunch'     },
  { label: 'Dinner',    value: 'dinner'    },
  { label: 'Snack',     value: 'snack'     },
]

export default function AddProductScreen({ navigation }: Props) {
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [modalVisible, setModalVisible] = useState(false)

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
      const currentUser = await AsyncStorage.getItem('currentUser')
      if (!currentUser) {
        Alert.alert('Error', 'User not found')
        return
      }

      const key = `entries_${currentUser}`
      const existingJson = await AsyncStorage.getItem(key)
      const existingEntries = existingJson ? JSON.parse(existingJson) : []

      const newEntry = {
        name: name.trim(),
        mealType,
        dateTime: new Date().toISOString(),
        calories: calNumber,
      }

      const updatedEntries = [...existingEntries, newEntry]
      await AsyncStorage.setItem(key, JSON.stringify(updatedEntries))

      Alert.alert('Saved', 'Entry has been saved', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      console.warn('Error saving entry:', error)
      Alert.alert('Error', 'Failed to save entry')
    }
  }

  const onCancelPress = () => {
    navigation.goBack()
  }

  const renderOption = ({ item }: { item: typeof MEAL_OPTIONS[number] }) => (
    <TouchableOpacity
      style={[
        localStyles.menuItem,
        { borderBottomColor: theme.border },
      ]}
      onPress={() => {
        setMealType(item.value)
        setModalVisible(false)
      }}
    >
      <Text style={[localStyles.menuItemText, { color: theme.textColor }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  )

  const currentLabel = MEAL_OPTIONS.find(x => x.value === mealType)?.label || 'Select'

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Text style={[styles.title, { color: theme.textColor }]}>
        Add Meal Entry
      </Text>

      {/* Meal Type */}
      <Text style={[styles.addLabel, { color: theme.textColor, marginTop: 16 }]}>
        Meal Type
      </Text>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
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
          {currentLabel}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 20 }}>▾</Text>
      </TouchableOpacity>

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
          <Text style={styles.loginButtonText}>Save Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Meal Type options */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={localStyles.overlay} />
        </TouchableWithoutFeedback>

        <View
          style={[
            localStyles.modalContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <FlatList
            data={MEAL_OPTIONS}
            renderItem={renderOption}
            keyExtractor={item => item.value}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  modalContainer: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    width: '80%',
    borderRadius: 8,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 32,
  },
  cancelButton: {
    backgroundColor: '#888', // серый фон для кнопки Cancel
  },
})
