import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useTheme } from '../navigation/ThemeContext'
import { deleteEntry, recalculateMealTypesForDate } from '../services/firebaseService'
import type { Entry } from '../services/firebaseService'
import styles from '../styles/styles'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: { entry?: Entry; suggestedDateTime?: string; targetMealType?: string; addToExistingMeal?: boolean }
  ProductInfo: { entry: Entry }
}

type Props = NativeStackScreenProps<RootStackParamList, 'ProductInfo'>

export default function ProductInfoScreen({ navigation, route }: Props) {
  const { theme } = useTheme()
  const { entry } = route.params

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const getMealTypeLabel = (mealType: string) => {
    const labels = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack'
    }
    return labels[mealType as keyof typeof labels] || mealType
  }

  const handleEdit = () => {
    navigation.navigate('AddProduct', { entry })
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (entry.id) {
                const entryDate = new Date(entry.dateTime)
                await deleteEntry(entry.id)
                // Recalculate meal types for the date after deletion
                await recalculateMealTypesForDate(entryDate)
                navigation.goBack()
              }
            } catch (error) {
              console.error('Error deleting entry:', error)
              Alert.alert('Error', 'Failed to delete entry')
            }
          },
        },
      ]
    )
  }

  const handleBack = () => {
    navigation.goBack()
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={localStyles.header}>
        <TouchableOpacity 
          style={localStyles.backButton}
          onPress={handleBack}
        >
          <Text style={[localStyles.backButtonText, { color: theme.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textColor }]}>
          Product Info
        </Text>
        <View style={localStyles.headerSpacer} />
      </View>

      <View style={[localStyles.infoContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={localStyles.infoRow}>
          <Text style={[localStyles.label, { color: theme.textSecondary }]}>
            Food Name:
          </Text>
          <Text style={[localStyles.value, { color: theme.textColor }]}>
            {entry.name}
          </Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={[localStyles.label, { color: theme.textSecondary }]}>
            Meal Type:
          </Text>
          <Text style={[localStyles.value, { color: theme.textColor }]}>
            {getMealTypeLabel(entry.mealType)}
          </Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={[localStyles.label, { color: theme.textSecondary }]}>
            Date:
          </Text>
          <Text style={[localStyles.value, { color: theme.textColor }]}>
            {formatDate(entry.dateTime)}
          </Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={[localStyles.label, { color: theme.textSecondary }]}>
            Time:
          </Text>
          <Text style={[localStyles.value, { color: theme.textColor }]}>
            {formatTime(entry.dateTime)}
          </Text>
        </View>

        <View style={localStyles.infoRow}>
          <Text style={[localStyles.label, { color: theme.textSecondary }]}>
            Calories:
          </Text>
          <Text style={[localStyles.value, { color: '#e53935' }]}>
            {entry.calories} kcal
          </Text>
        </View>
      </View>

      <View style={localStyles.buttonContainer}>
        <TouchableOpacity
          style={[styles.loginButton, localStyles.editButton]}
          onPress={handleEdit}
        >
          <Text style={styles.loginButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, localStyles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.loginButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 50, // Balance the back button space
  },
  infoContainer: {
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#e53935',
  },
})