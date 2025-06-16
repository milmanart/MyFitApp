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
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getDeletedEntries, restoreEntry, permanentlyDeleteEntry } from '../services/firebaseService'
import type { Entry } from '../services/firebaseService'
import { warningHaptic } from '../utils/hapticUtils'

// Import authentication context and theme
import { AuthContext } from '../navigation/AuthContext'
import { useTheme } from '../navigation/ThemeContext'

// Import styles
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import SwipeableTrashCard from '../components/SwipeableTrashCard'
import { useResponsiveDimensions } from '../hooks/useResponsiveDimensions'

type RootStackParamList = {
  Home: undefined
  Trash: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'Trash'>

export default function TrashScreen({ navigation }: Props) {
  const { user } = useContext(AuthContext)
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { containerPadding, maxContentWidth } = useResponsiveDimensions()
  const [deletedEntries, setDeletedEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Function to load deleted entries from Firestore
  const fetchDeletedEntries = async () => {
    if (!user) {
      console.log('TrashScreen: No user found, skipping fetchDeletedEntries')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const entriesData = await getDeletedEntries()
      setDeletedEntries(entriesData)
    } catch (error) {
      console.error('Error fetching deleted entries:', error)
      Alert.alert('Error', 'Failed to fetch deleted entries')
      setDeletedEntries([])
    } finally {
      setLoading(false)
    }
  }

  // Function for pull-to-refresh
  const onRefresh = async () => {
    if (!user) {
      console.log('TrashScreen: No user found, skipping refresh')
      return
    }
    
    setRefreshing(true)
    try {
      console.log('TrashScreen: Pull-to-refresh triggered, reloading deleted entries...')
      const entriesData = await getDeletedEntries()
      setDeletedEntries(entriesData)
      console.log('TrashScreen: Refresh completed successfully')
    } catch (error) {
      console.error('Error during refresh:', error)
      Alert.alert('Error', 'Failed to refresh deleted entries')
    } finally {
      setRefreshing(false)
    }
  }

  // Reload data when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchDeletedEntries()
    }, [user])
  )

  // Handle entry restoration
  const handleRestoreEntry = async (entryId: string) => {
    try {
      // Optimistically remove from trash UI immediately
      setDeletedEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId))
      
      // Then perform the actual restoration
      await restoreEntry(entryId)
    } catch (error) {
      console.error('Error restoring entry:', error)
      Alert.alert('Error', 'Failed to restore entry')
      // Reload entries on error to restore state
      fetchDeletedEntries()
    }
  }

  // Handle permanent deletion
  const handlePermanentDelete = async (entryId: string) => {
    try {
      // Optimistically remove from trash UI immediately
      setDeletedEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId))
      
      // Then perform the actual permanent deletion
      await permanentlyDeleteEntry(entryId)
    } catch (error) {
      console.error('Error permanently deleting entry:', error)
      Alert.alert('Error', 'Failed to permanently delete entry')
      // Reload entries on error to restore state
      fetchDeletedEntries()
    }
  }

  // Handle clearing entire trash
  const handleClearTrash = async () => {
    if (deletedEntries.length === 0) return

    await warningHaptic() // Vibration for warning action

    Alert.alert(
      'Clear Trash',
      `Are you sure you want to permanently delete all ${deletedEntries.length} items? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              
              // Delete all entries permanently
              const deletePromises = deletedEntries.map(entry => 
                permanentlyDeleteEntry(entry.id!)
              )
              
              await Promise.all(deletePromises)
              
              // Clear the UI
              setDeletedEntries([])
              setLoading(false)
              
              Alert.alert('Success', 'All items have been permanently deleted')
            } catch (error) {
              console.error('Error clearing trash:', error)
              Alert.alert('Error', 'Failed to clear trash')
              // Reload entries on error
              fetchDeletedEntries()
            }
          }
        }
      ]
    )
  }

  // Render single deleted entry with swipe functionality
  const renderDeletedItem = ({ item }: { item: Entry }) => {
    return (
      <SwipeableTrashCard
        item={item}
        onPress={() => {}} // No action on press in trash
        onRestore={() => handleRestoreEntry(item.id!)}
        onPermanentDelete={() => handlePermanentDelete(item.id!)}
      />
    )
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
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.sidebarButtonText, { color: theme.textColor }]}>
            ‹
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: theme.textColor, flex: 1, textAlign: 'center' }]}>
          Trash
        </Text>
        
        <View style={styles.headerPlaceholder} />
      </View>

      {/* CLEAR BUTTON AND TRASH INFO */}
      {deletedEntries.length > 0 && (
        <View style={{
          paddingHorizontal: containerPadding,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          backgroundColor: theme.cardBackground,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%'
        }}>
          {/* Clear All Button - Full Width */}
          <TouchableOpacity
            style={{
              backgroundColor: '#ff4444',
              paddingVertical: 14,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}
            onPress={handleClearTrash}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 6 }}>
              Clear All Items
            </Text>
            <Text style={{ color: '#fff', fontSize: 16 }}>🗑️</Text>
          </TouchableOpacity>
          
          {/* Info Text */}
          <View style={{ alignItems: 'center' }}>
            <Text style={[{ color: theme.textColor, fontSize: 16, fontWeight: 'bold' }]}>
              {deletedEntries.length} {deletedEntries.length === 1 ? 'item' : 'items'} in trash
            </Text>
            <Text style={[{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }]}>
              Swipe items to restore or delete permanently
            </Text>
          </View>
        </View>
      )}

      {/* CONTENT */}
      {deletedEntries.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]} // Android
              tintColor={theme.primary} // iOS
              title="Refreshing..." // iOS
              titleColor={theme.textSecondary} // iOS
            />
          }
        >
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No deleted entries
          </Text>
          <Text style={[styles.emptySubText, { color: theme.textSecondary, marginTop: 8, fontSize: 14 }]}>
            Pull down to refresh
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={deletedEntries}
          keyExtractor={(item) => item.id!}
          renderItem={renderDeletedItem}
          contentContainerStyle={[
            styles.listContent, 
            { 
              paddingHorizontal: containerPadding,
              maxWidth: maxContentWidth,
              alignSelf: 'center',
              width: '100%'
            }
          ]}
          style={{ width: '100%' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]} // Android
              tintColor={theme.primary} // iOS
              title="Refreshing..." // iOS
              titleColor={theme.textSecondary} // iOS
            />
          }
        />
      )}
    </View>
  )
}