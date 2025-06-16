import React, { useState, useEffect, useCallback, useContext } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useResponsiveDimensions } from '../hooks/useResponsiveDimensions'
import { OfflineDataService } from '../services/offlineDataService'
import type { Entry } from '../services/firebaseService'
import { getMealTypeLabel } from '../utils/mealTypeUtils'
import { lightHaptic, selectionHaptic } from '../utils/hapticUtils'
import { handleNetworkError, withRetry } from '../utils/errorUtils'
import { useNetwork } from '../utils/networkUtils'

import { AuthContext } from '../navigation/AuthContext'
import { useTheme } from '../navigation/ThemeContext'
import AddButton from '../components/AddButton'
import Sidebar from '../components/Sidebar'
import DatePickerModal from '../components/DatePickerModal'
import SwipeableCard from '../components/SwipeableCard'
import SyncStatusIndicator from '../components/SyncStatusIndicator'

import { useOfflineSync } from '../hooks/useOfflineSync'
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
  const { isLandscape, containerPadding, listPadding, maxContentWidth } = useResponsiveDimensions()
  
  useOfflineSync()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [datePickerVisible, setDatePickerVisible] = useState(false)

  const isSameDate = (iso: string, compareDate: Date) => {
    const d = new Date(iso)
    return (
      d.getFullYear() === compareDate.getFullYear() &&
      d.getMonth() === compareDate.getMonth() &&
      d.getDate() === compareDate.getDate()
    )
  }

  const fetchEntries = async () => {
    if (!user) {
      console.log('HomeScreen: No user found, skipping fetchEntries')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Use offline-capable data service
      const entriesData = await OfflineDataService.getEntriesForDate(selectedDate)
      setEntries(entriesData)
    } catch (error) {
      console.error('Error fetching entries:', error)
      await handleNetworkError(error, 'Failed to load your entries')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    if (!user) {
      console.log('HomeScreen: No user found, skipping refresh')
      return
    }
    
    setRefreshing(true)
    try {
      console.log('HomeScreen: Pull-to-refresh triggered, forcing sync...')
      
      // Force sync to get latest data from Firebase
      await OfflineDataService.forceSync()
      
      // Then reload entries for current date
      const entriesData = await OfflineDataService.getEntriesForDate(selectedDate)
      setEntries(entriesData)
      
      console.log('HomeScreen: Refresh completed successfully')
    } catch (error) {
      console.error('Error during refresh:', error)
      await handleNetworkError(error, 'Failed to sync data')
    } finally {
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen: useFocusEffect triggered, user:', user ? 'authenticated' : 'not authenticated')
      fetchEntries()
    }, [selectedDate, user])
  )

  const goToPreviousDay = async () => {
    await selectionHaptic()
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = async () => {
    await selectionHaptic()
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.mealType]) {
      acc[entry.mealType] = []
    }
    acc[entry.mealType].push(entry)
    return acc
  }, {} as Record<string, Entry[]>)

  const mealOrder = ['breakfast', 'snack', 'lunch', 'dinner']
  const availableMealTypes = mealOrder.filter(mealType => groupedEntries[mealType] && groupedEntries[mealType].length > 0)

  const handleDeleteEntry = async (entryId: string) => {
    try {
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId))
      await OfflineDataService.deleteEntry(entryId)
    } catch (error) {
      console.error('Error deleting entry:', error)
      Alert.alert('Error', 'Failed to delete entry')
      fetchEntries()
    }
  }

  const handleEditEntry = (entry: Entry) => {
    navigation.navigate('AddProduct', { entry })
  }

  const renderItem = ({ item }: { item: Entry }) => {
    return (
      <SwipeableCard
        item={item}
        onPress={() => navigation.navigate('ProductInfo', { entry: item })}
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
    return entries.reduce((total, entry) => total + entry.calories, 0)
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
      
      const avgTime = (minTime + maxTime) / 2
      targetDate.setTime(avgTime)
    } else {
      const defaultTimes = {
        breakfast: { hour: 8, minute: 0 },
        lunch: { hour: 13, minute: 0 },
        dinner: { hour: 19, minute: 0 },
        snack: { hour: 15, minute: 0 }
      }
      
      const defaultTime = defaultTimes[mealType as keyof typeof defaultTimes] || { hour: 12, minute: 0 }
      targetDate.setHours(defaultTime.hour, defaultTime.minute, 0, 0)
    }
    
    navigation.navigate('AddProduct', { 
      suggestedDateTime: targetDate.toISOString(),
      targetMealType: mealType,
      addToExistingMeal: existingEntries.length > 0
    })
  }

  const renderMealSection = (mealType: string) => {
    const entries = groupedEntries[mealType] || []
    const totalCalories = calculateMealCalories(entries)
    const sectionTitle = getMealTypeLabel(mealType as any)
    
    return (
      <View key={mealType} style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: theme.textColor, marginBottom: 0 }]}>
            {sectionTitle}
          </Text>
          <Text style={[{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }]}>
            {totalCalories} kcal
          </Text>
        </View>
        
        {entries.map((entry, index) => (
          <View key={`${entry.id || entry.dateTime}-${index}`}>
            {renderItem({ item: entry })}
          </View>
        ))}
        
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
      <View style={[
        styles.headerContainer, 
        { 
          paddingTop: insets.top + 8,
          paddingHorizontal: containerPadding,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%'
        }
      ]}>
        <TouchableOpacity
          style={styles.sidebarButton}
          onPress={async () => {
            await lightHaptic()
            setSidebarVisible(true)
          }}
        >
          <Text style={[styles.sidebarButtonText, { color: theme.textColor }]}>
            ☰
          </Text>
        </TouchableOpacity>
        
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
            await lightHaptic()
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

      <SyncStatusIndicator />

      {entries.length > 0 && (
        <View style={{
          paddingHorizontal: containerPadding,
          paddingVertical: 12,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.cardBackground,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%'
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

      {availableMealTypes.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              title="Syncing data..."
              titleColor={theme.textSecondary}
            />
          }
        >
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No entries for this date
          </Text>
          <Text style={[styles.emptySubText, { color: theme.textSecondary, marginTop: 8, fontSize: 14 }]}>
            Pull down to sync with Firebase
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={availableMealTypes}
          keyExtractor={(mealType) => mealType}
          renderItem={({ item: mealType }) => renderMealSection(mealType)}
          contentContainerStyle={[
            styles.listContent, 
            { 
              paddingHorizontal: containerPadding,
              maxWidth: maxContentWidth,
              alignSelf: 'center',
              width: '100%'
            }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              title="Syncing data..."
              titleColor={theme.textSecondary}
            />
          }
        />
      )}

      <AddButton
        onPress={() => navigation.navigate('AddProduct')}
        style={[styles.fabPosition, { bottom: 15 }]}
      />

      <Sidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
        onTrashPress={() => navigation.navigate('Trash')}
        onProfilePress={() => navigation.navigate('Profile')}
        user={user}
      />

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