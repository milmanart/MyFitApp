import AsyncStorage from '@react-native-async-storage/async-storage'
import { Entry } from './firebaseService'

// Storage keys
export const STORAGE_KEYS = {
  ENTRIES_CACHE: 'entries_cache',
  PENDING_OPERATIONS: 'pending_operations',
  LAST_SYNC: 'last_sync_timestamp',
  SYNC_STATUS: 'sync_status'
} as const

export interface PendingOperation {
  id: string
  type: 'add' | 'update' | 'delete'
  data: Entry
  timestamp: number
  tempId?: string // For new entries created offline
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  pendingCount: number
  hasConflicts: boolean
}

export class OfflineStorage {
  // Cache management
  static async getCachedEntries(userId: string): Promise<Entry[]> {
    try {
      const cacheKey = `${STORAGE_KEYS.ENTRIES_CACHE}_${userId}`
      const cached = await AsyncStorage.getItem(cacheKey)
      return cached ? JSON.parse(cached) : []
    } catch (error) {
      console.error('Error getting cached entries:', error)
      return []
    }
  }

  static async setCachedEntries(userId: string, entries: Entry[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.ENTRIES_CACHE}_${userId}`
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entries))
      console.log(`Cached ${entries.length} entries for user ${userId}`)
    } catch (error) {
      console.error('Error caching entries:', error)
    }
  }

  static async clearCachedEntries(userId: string): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.ENTRIES_CACHE}_${userId}`
      await AsyncStorage.removeItem(cacheKey)
    } catch (error) {
      console.error('Error clearing cached entries:', error)
    }
  }

  // Pending operations management
  static async getPendingOperations(userId: string): Promise<PendingOperation[]> {
    try {
      const opKey = `${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`
      const pending = await AsyncStorage.getItem(opKey)
      if (!pending) return []
      
      const operations = JSON.parse(pending)
      
      // Filter out invalid operations
      const validOperations = operations.filter((op: any) => {
        if (!op || typeof op !== 'object') {
          console.warn('Removing invalid pending operation:', op)
          return false
        }
        
        if (!op.data || typeof op.data !== 'object') {
          console.warn('Removing pending operation with invalid data:', op)
          return false
        }
        
        if (!op.id || !op.type || !op.timestamp) {
          console.warn('Removing pending operation with missing required fields:', op)
          return false
        }
        
        return true
      })
      
      // If we filtered out any operations, save the cleaned list
      if (validOperations.length !== operations.length) {
        console.log(`Cleaned pending operations: ${operations.length} -> ${validOperations.length}`)
        await AsyncStorage.setItem(opKey, JSON.stringify(validOperations))
      }
      
      return validOperations
    } catch (error) {
      console.error('Error getting pending operations:', error)
      return []
    }
  }

  static async addPendingOperation(userId: string, operation: PendingOperation): Promise<void> {
    try {
      const pending = await this.getPendingOperations(userId)
      
      // Check for existing operations to prevent duplicates
      const existingOpIndex = pending.findIndex(op => {
        const sameType = op.type === operation.type
        const sameId = op.data.id === operation.data.id || op.tempId === operation.tempId
        const sameContent = (
          op.data.name === operation.data.name &&
          op.data.mealType === operation.data.mealType &&
          op.data.dateTime === operation.data.dateTime &&
          op.data.calories === operation.data.calories
        )
        return sameType && (sameId || sameContent)
      })
      
      if (existingOpIndex !== -1) {
        // Update existing operation with newer timestamp
        if (operation.timestamp > pending[existingOpIndex].timestamp) {
          pending[existingOpIndex] = operation
          console.log(`Updated existing pending operation: ${operation.type} for ${operation.id}`)
        } else {
          console.log(`Skipped duplicate pending operation: ${operation.type} for ${operation.id}`)
          return
        }
      } else {
        pending.push(operation)
        console.log(`Added pending operation: ${operation.type} for ${operation.id}`)
      }
      
      const opKey = `${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`
      await AsyncStorage.setItem(opKey, JSON.stringify(pending))
    } catch (error) {
      console.error('Error adding pending operation:', error)
    }
  }

  static async removePendingOperation(userId: string, operationId: string): Promise<void> {
    try {
      const pending = await this.getPendingOperations(userId)
      const filtered = pending.filter(op => op.id !== operationId)
      const opKey = `${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`
      await AsyncStorage.setItem(opKey, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error removing pending operation:', error)
    }
  }

  static async clearPendingOperations(userId: string): Promise<void> {
    try {
      const opKey = `${STORAGE_KEYS.PENDING_OPERATIONS}_${userId}`
      await AsyncStorage.removeItem(opKey)
    } catch (error) {
      console.error('Error clearing pending operations:', error)
    }
  }

  // Sync status management
  static async getSyncStatus(userId: string): Promise<SyncStatus> {
    try {
      const statusKey = `${STORAGE_KEYS.SYNC_STATUS}_${userId}`
      const status = await AsyncStorage.getItem(statusKey)
      const pendingOps = await this.getPendingOperations(userId)
      
      if (status) {
        const parsed = JSON.parse(status)
        return {
          ...parsed,
          pendingCount: pendingOps.length
        }
      }
      
      return {
        isOnline: true,
        isSyncing: false,
        lastSyncTime: null,
        pendingCount: pendingOps.length,
        hasConflicts: false
      }
    } catch (error) {
      console.error('Error getting sync status:', error)
      return {
        isOnline: true,
        isSyncing: false,
        lastSyncTime: null,
        pendingCount: 0,
        hasConflicts: false
      }
    }
  }

  static async setSyncStatus(userId: string, status: Partial<SyncStatus>): Promise<void> {
    try {
      const current = await this.getSyncStatus(userId)
      const updated = { ...current, ...status }
      const statusKey = `${STORAGE_KEYS.SYNC_STATUS}_${userId}`
      await AsyncStorage.setItem(statusKey, JSON.stringify(updated))
    } catch (error) {
      console.error('Error setting sync status:', error)
    }
  }

  static async updateLastSyncTime(userId: string): Promise<void> {
    try {
      await this.setSyncStatus(userId, { 
        lastSyncTime: Date.now(),
        isSyncing: false 
      })
    } catch (error) {
      console.error('Error updating last sync time:', error)
    }
  }

  // Utility methods
  static generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static async getEntriesForDate(userId: string, date: Date): Promise<Entry[]> {
    const allEntries = await this.getCachedEntries(userId)
    
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return allEntries.filter(entry => {
      const entryDate = new Date(entry.dateTime)
      const isInDateRange = entryDate >= startOfDay && entryDate <= endOfDay
      const isNotDeleted = !entry.isDeleted
      return isInDateRange && isNotDeleted
    }).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
  }

  static async addEntryToCache(userId: string, entry: Entry): Promise<void> {
    const entries = await this.getCachedEntries(userId)
    
    // Check for duplicates before adding
    const existingIndex = entries.findIndex(existing => {
      // Check by ID first
      if (existing.id === entry.id) return true
      
      // Check by content for potential duplicates
      return (
        existing.name === entry.name &&
        existing.mealType === entry.mealType &&
        existing.dateTime === entry.dateTime &&
        existing.calories === entry.calories &&
        existing.userId === entry.userId &&
        !existing.isDeleted
      )
    })
    
    if (existingIndex !== -1) {
      // Update existing entry instead of adding duplicate
      entries[existingIndex] = { ...entries[existingIndex], ...entry }
      console.log(`Updated existing cache entry: ${entry.id}`)
    } else {
      entries.push(entry)
      console.log(`Added new cache entry: ${entry.id}`)
    }
    
    await this.setCachedEntries(userId, entries)
  }

  static async updateEntryInCache(userId: string, entryId: string, updates: Partial<Entry>): Promise<void> {
    const entries = await this.getCachedEntries(userId)
    const index = entries.findIndex(e => e.id === entryId)
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates }
      await this.setCachedEntries(userId, entries)
    }
  }

  static async deleteEntryFromCache(userId: string, entryId: string): Promise<void> {
    const entries = await this.getCachedEntries(userId)
    const index = entries.findIndex(e => e.id === entryId)
    if (index !== -1) {
      entries[index] = { 
        ...entries[index], 
        isDeleted: true, 
        deletedAt: new Date().toISOString() 
      }
      await this.setCachedEntries(userId, entries)
    }
  }

  // Clear all offline data for user
  static async clearAllUserData(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.clearCachedEntries(userId),
        this.clearPendingOperations(userId),
        AsyncStorage.removeItem(`${STORAGE_KEYS.SYNC_STATUS}_${userId}`)
      ])
      console.log(`Cleared all offline data for user ${userId}`)
    } catch (error) {
      console.error('Error clearing user data:', error)
    }
  }
}