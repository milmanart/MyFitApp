import React, { useState, useEffect, useCallback, useContext } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getDeletedEntries, restoreEntry, permanentlyDeleteEntry } from '../services/firebaseService'
import type { Entry } from '../services/firebaseService'

// Import authentication context and theme
import { AuthContext } from '../navigation/AuthContext'
import { useTheme } from '../navigation/ThemeContext'

// Import styles
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import SwipeableTrashCard from '../components/SwipeableTrashCard'

type RootStackParamList = {
  Home: undefined
  Trash: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'Trash'>

export default function TrashScreen({ navigation }: Props) {
  const { user } = useContext(AuthContext)
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [deletedEntries, setDeletedEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

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

      {/* CONTENT */}
      {deletedEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No deleted entries
          </Text>
        </View>
      ) : (
        <FlatList
          data={deletedEntries}
          keyExtractor={(item) => item.id!}
          renderItem={renderDeletedItem}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: 0 }]}
        />
      )}
    </View>
  )
}