// MyFitApp/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useContext } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { getEntriesForDate, recalculateMealTypesForDate, deleteEntry } from '../services/firebaseService'
import type { Entry } from '../services/firebaseService'
import { assignMealTypes, getMealTypeLabel } from '../utils/mealTypeUtils'
import { lightHaptic, selectionHaptic } from '../utils/hapticUtils'
import { handleNetworkError, withRetry } from '../utils/errorUtils'
import { useNetwork } from '../utils/networkUtils'

// Import authentication context and theme
import { AuthContext } from '../navigation/AuthContext'
import { useTheme } from '../navigation/ThemeContext'

// Import add button and sidebar
import AddButton from '../components/AddButton'
import Sidebar from '../components/Sidebar'
import DatePickerModal from '../components/DatePickerModal'
import SwipeableCard from '../components/SwipeableCard'

// Import styles
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: { entry?: Entry; suggestedDateTime?: string; targetMealType?: string; addToExistingMeal?: boolean }
  ProductInfo: { entry: Entry }
  Profile: undefined
  Trash: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export default function HomeScreen({ navigation }: Props) {
  const { signOut, user } = useContext(AuthContext)
  const { theme } = useTheme()
  const { isConnected } = useNetwork()
  const insets = useSafeAreaInsets()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [datePickerVisible, setDatePickerVisible] = useState(false)

  // Helper to check if date matches selected date
  const isSameDate = (iso: string, compareDate: Date) => {
    const d = new Date(iso)
    return (
      d.getFullYear() === compareDate.getFullYear() &&
      d.getMonth() === compareDate.getMonth() &&
      d.getDate() === compareDate.getDate()
    )
  }

  // Function to load entries from Firestore
  const fetchEntries = async () => {
    if (!user) {
      console.log('HomeScreen: No user found, skipping fetchEntries')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Use retry mechanism for data fetching
      const entriesData = await withRetry(() => getEntriesForDate(selectedDate))
      setEntries(entriesData)
    } catch (error) {
      console.error('Error fetching entries:', error)
      await handleNetworkError(error, 'Failed to load your entries')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  // Reload data when screen focuses or selected date changes
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen: useFocusEffect triggered, user:', user ? 'authenticated' : 'not authenticated')
      fetchEntries()
    }, [selectedDate, user])
  )

  // Functions for date navigation
  const goToPreviousDay = async () => {
    await selectionHaptic() // Vibrate on date navigation
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = async () => {
    await selectionHaptic() // Vibrate on date navigation
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  // Format selected date
  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Apply dynamic meal type assignment
  const entriesWithCorrectTypes = assignMealTypes(entries)

  // Group entries by meal type after dynamic assignment
  const groupedEntries = entriesWithCorrectTypes.reduce((acc, entry) => {
    if (!acc[entry.mealType]) {
      acc[entry.mealType] = []
    }
    acc[entry.mealType].push(entry)
    return acc
  }, {} as Record<string, Entry[]>)

  // Define meal order and filter existing ones
  const mealOrder = ['breakfast', 'snack', 'lunch', 'dinner']
  const availableMealTypes = mealOrder.filter(mealType => groupedEntries[mealType] && groupedEntries[mealType].length > 0)

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: string) => {
    try {
      // Optimistically remove from UI immediately
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId))
      
      // Then perform the actual deletion
      await deleteEntry(entryId)
    } catch (error) {
      console.error('Error deleting entry:', error)
      Alert.alert('Error', 'Failed to delete entry')
      // Reload entries on error to restore state
      fetchEntries()
    }
  }

  // Handle entry editing
  const handleEditEntry = (entry: Entry) => {
    navigation.navigate('AddProduct', { entry })
  }

  // Render single card with swipe functionality
  const renderItem = ({ item }: { item: Entry }) => {
    return (
      <SwipeableCard
        item={item}
        onPress={() => navigation.navigate('ProductInfo', { entry: item })}
        onEdit={() => handleEditEntry(item)}
        onDelete={() => handleDeleteEntry(item.id!)}
      />
    )
  }

  // Calculate total calories for a meal type
  const calculateMealCalories = (entries: Entry[]) => {
    return entries.reduce((total, entry) => total + entry.calories, 0)
  }

  // Calculate total calories for the entire day
  const calculateDailyTotalCalories = () => {
    return entriesWithCorrectTypes.reduce((total, entry) => total + entry.calories, 0)
  }

  // Handle adding product to specific meal type
  const handleAddToMeal = (mealType: string) => {
    const targetDate = new Date(selectedDate)
    const existingEntries = groupedEntries[mealType] || []
    
    if (existingEntries.length > 0) {
      // Find the time range of existing entries in this meal type
      const times = existingEntries.map(entry => new Date(entry.dateTime).getTime())
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)
      
      // Use the average time of existing entries, but ensure it's within the meal's time window
      const avgTime = (minTime + maxTime) / 2
      targetDate.setTime(avgTime)
    } else {
      // Fallback to default times if no existing entries
      const defaultTimes = {
        breakfast: { hour: 8, minute: 0 },
        lunch: { hour: 13, minute: 0 },
        dinner: { hour: 19, minute: 0 },
        snack: { hour: 15, minute: 0 }
      }
      
      const defaultTime = defaultTimes[mealType as keyof typeof defaultTimes] || { hour: 12, minute: 0 }
      targetDate.setHours(defaultTime.hour, defaultTime.minute, 0, 0)
    }
    
    // Navigate to AddProduct with suggested time but no entry (creating new)
    navigation.navigate('AddProduct', { 
      suggestedDateTime: targetDate.toISOString(),
      targetMealType: mealType,
      addToExistingMeal: existingEntries.length > 0
    })
  }

  // Render meal section
  const renderMealSection = (mealType: string) => {
    const entries = groupedEntries[mealType] || []
    const totalCalories = calculateMealCalories(entries)
    const sectionTitle = getMealTypeLabel(mealType as any)
    
    return (
      <View key={mealType} style={{ marginBottom: 24 }}>
        {/* Section Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.textColor, marginBottom: 0 }]}>
            {sectionTitle}
          </Text>
          <Text style={[{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }]}>
            {totalCalories} kcal
          </Text>
        </View>
        
        {/* Entries */}
        {entries.map((entry, index) => (
          <View key={`${entry.id || entry.dateTime}-${index}`}>
            {renderItem({ item: entry })}
          </View>
        ))}
        
        {/* Add Product Button */}
        <TouchableOpacity
          style={[
            {
              marginTop: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: 'dashed',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            },
            { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
          ]}
          onPress={() => handleAddToMeal(mealType)}
        >
          <Text style={[{ color: theme.primary, fontSize: 16, fontWeight: '500', marginRight: 4 }]}>+</Text>
          <Text style={[{ color: theme.primary, fontSize: 14 }]}>Add to {sectionTitle}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleLogout = async () => {
    await signOut()
    // Navigation will happen automatically via AuthContext state change
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundColor },
        ]}
      >
        <ActivityIndicator size="large" color="#0080ff" />
        <Text style={[styles.loadingText, { color: theme.textColor }]}>
          Loading...
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* HEADER */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.sidebarButton}
          onPress={async () => {
            await lightHaptic() // Vibrate when opening sidebar
            setSidebarVisible(true)
          }}
        >
          <Text style={[styles.sidebarButtonText, { color: theme.textColor }]}>
            ☰
          </Text>
        </TouchableOpacity>
        
        {/* DATE PICKER WITH ARROWS */}
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={goToPreviousDay}
          >
            <Text style={[styles.dateArrowText, { color: theme.textColor }]}>
              ‹
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={async () => {
            await lightHaptic() // Vibrate when opening date picker
            setDatePickerVisible(true)
          }}>
            <Text style={[styles.dateText, { color: theme.textColor }]}>
              {formatSelectedDate(selectedDate)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={goToNextDay}
          >
            <Text style={[styles.dateArrowText, { color: theme.textColor }]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={async () => {
            await lightHaptic() // Vibrate when opening profile
            navigation.navigate('Profile')
          }}
        >
          <Text style={styles.profileButtonText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* NETWORK STATUS INDICATOR */}
      {!isConnected && (
        <View style={{
          backgroundColor: '#ff9800',
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: 'center',
        }}>
          <Text style={{
            color: '#fff',
            fontSize: 14,
            fontWeight: '500',
          }}>
            📶 No internet connection - some features may be limited
          </Text>
        </View>
      )}

      {/* DAILY TOTAL CALORIES */}
      {entriesWithCorrectTypes.length > 0 && (
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.cardBackground,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.textColor,
          }}>
            Total: {calculateDailyTotalCalories()} kcal
          </Text>
        </View>
      )}

      {/* CONTENT */}
      {availableMealTypes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No entries for this date
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableMealTypes}
          keyExtractor={(mealType) => mealType}
          renderItem={({ item: mealType }) => renderMealSection(mealType)}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB: "+" button */}
      <AddButton
        onPress={() => navigation.navigate('AddProduct')}
        style={[styles.fabPosition, { bottom: 15 }]}
      />

      {/* SIDEBAR MODAL */}
      <Sidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
        onTrashPress={() => navigation.navigate('Trash')}
        onProfilePress={() => navigation.navigate('Profile')}
        user={user}
      />

      {/* DATE PICKER MODAL */}
      <DatePickerModal
        isVisible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectedDate(date)
          setDatePickerVisible(false)
        }}
      />
    </View>
  )
}