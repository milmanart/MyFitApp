import { OfflineStorage, PendingOperation } from './offlineStorage'
import { SyncManager } from './syncManager'
import { Entry } from './firebaseService'
import { checkNetworkConnection } from '../utils/networkUtils'
import { showError, showSuccess } from '../utils/errorUtils'

export interface OfflineCapableEntry extends Omit<Entry, 'id'> {
  id?: string
  isLocalOnly?: boolean
  needsSync?: boolean
}

export class OfflineDataService {
  private static async getCurrentUserId(): Promise<string> {
    // Get user ID from auth context or Firebase auth
    const { auth } = await import('../firebase')
    if (!auth.currentUser) {
      throw new Error('User not authenticated')
    }
    return auth.currentUser.uid
  }

  // Initialize offline capabilities for user
  static async initializeOfflineMode(userId: string): Promise<void> {
    try {
      console.log('Initializing offline mode for user:', userId)
      
      // Try to sync data if online
      const isOnline = await checkNetworkConnection()
      if (isOnline) {
        await SyncManager.syncData(userId, false)
      } else {
        // Set offline status
        await OfflineStorage.setSyncStatus(userId, {
          isOnline: false,
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          hasConflicts: false
        })
      }
    } catch (error) {
      console.error('Error initializing offline mode:', error)
    }
  }

  // Get entries for date (offline-first)
  static async getEntriesForDate(date: Date): Promise<Entry[]> {
    const userId = await this.getCurrentUserId()
    
    try {
      // First, try to get from local cache
      const cachedEntries = await OfflineStorage.getEntriesForDate(userId, date)
      
      // If online, try to sync and get fresh data
      const isOnline = await checkNetworkConnection()
      if (isOnline) {
        try {
          // Background sync (don't wait for it)
          SyncManager.syncData(userId, false).catch(error => {
            console.log('Background sync failed:', error)
          })
        } catch (error) {
          console.log('Background sync error:', error)
        }
      }
      
      return cachedEntries
    } catch (error) {
      console.error('Error getting entries for date:', error)
      return []
    }
  }

  // Add entry (offline-capable)
  static async addEntry(entryData: OfflineCapableEntry): Promise<Entry> {
    const userId = await this.getCurrentUserId()
    const isOnline = await checkNetworkConnection()
    
    // Check for potential duplicates in cache first
    const cachedEntries = await OfflineStorage.getCachedEntries(userId)
    const potentialDuplicate = cachedEntries.find(existing => 
      existing.name === entryData.name &&
      existing.mealType === entryData.mealType &&
      existing.dateTime === entryData.dateTime &&
      existing.calories === entryData.calories &&
      !existing.isDeleted
    )
    
    if (potentialDuplicate) {
      console.log('Potential duplicate found in cache, skipping add')
      showSuccess('Entry already exists')
      return potentialDuplicate
    }
    
    // Create entry with temp ID if offline
    const entry: Entry = {
      ...entryData,
      id: entryData.id || OfflineStorage.generateTempId(),
      userId,
      isDeleted: false
    }

    try {
      if (isOnline) {
        // Try to save online first
        try {
          const { addEntry: firebaseAddEntry } = await import('./firebaseService')
          await firebaseAddEntry({
            name: entry.name,
            mealType: entry.mealType,
            dateTime: entry.dateTime,
            calories: entry.calories
          })
          
          // Sync to get the real ID from server
          await SyncManager.syncData(userId, false)
          
          showSuccess('Entry saved successfully')
          return entry
        } catch (onlineError) {
          console.log('Online save failed, falling back to offline:', onlineError)
          // Fall through to offline mode
        }
      }

      // Offline mode or online save failed
      await OfflineStorage.addEntryToCache(userId, entry)
      
      // Add to pending operations only if not duplicate
      const pendingOp: PendingOperation = {
        id: OfflineStorage.generateTempId(),
        type: 'add',
        data: entry,
        timestamp: Date.now(),
        tempId: entry.id
      }
      
      await OfflineStorage.addPendingOperation(userId, pendingOp)
      await OfflineStorage.setSyncStatus(userId, { pendingCount: (await OfflineStorage.getPendingOperations(userId)).length })
      
      if (!isOnline) {
        showSuccess('Entry saved offline - will sync when online')
      } else {
        showSuccess('Entry saved (will sync in background)')
      }
      
      return entry
    } catch (error) {
      console.error('Error adding entry:', error)
      throw error
    }
  }

  // Update entry (offline-capable)
  static async updateEntry(entryId: string, updates: Partial<OfflineCapableEntry>): Promise<void> {
    const userId = await this.getCurrentUserId()
    const isOnline = await checkNetworkConnection()
    
    console.log('OfflineDataService.updateEntry called with:', { entryId, updates })
    
    try {
      // Get current entry to check for conflicts
      const cachedEntries = await OfflineStorage.getCachedEntries(userId)
      const currentEntry = cachedEntries.find(e => e.id === entryId)
      
      if (!currentEntry) {
        throw new Error(`Entry ${entryId} not found`)
      }
      
      // Update in cache first
      await OfflineStorage.updateEntryInCache(userId, entryId, updates)
      
      if (isOnline && !entryId.startsWith('temp_')) {
        // Try to update online if not a temp ID
        try {
          const { updateEntry: firebaseUpdateEntry } = await import('./firebaseService')
          // Clean updates object - remove offline-specific fields
          const cleanUpdates = { ...updates }
          delete cleanUpdates.isLocalOnly
          delete cleanUpdates.needsSync
          delete cleanUpdates.id
          delete cleanUpdates.userId
          
          await firebaseUpdateEntry(entryId, cleanUpdates)
          showSuccess('Entry updated successfully')
          return
        } catch (onlineError) {
          console.log('Online update failed, adding to pending:', onlineError)
        }
      }

      // Add to pending operations
      // Get fresh cache after update
      const freshCachedEntries = await OfflineStorage.getCachedEntries(userId)
      const updatedEntry = freshCachedEntries.find(e => e.id === entryId)
      
      if (updatedEntry) {
        const pendingOp: PendingOperation = {
          id: OfflineStorage.generateTempId(),
          type: 'update',
          data: updatedEntry,
          timestamp: Date.now()
        }
        
        await OfflineStorage.addPendingOperation(userId, pendingOp)
        await OfflineStorage.setSyncStatus(userId, { pendingCount: (await OfflineStorage.getPendingOperations(userId)).length })
        
        if (!isOnline) {
          showSuccess('Entry updated offline - will sync when online')
        } else {
          showSuccess('Entry updated (will sync in background)')
        }
      } else {
        console.warn('Updated entry not found in cache after update')
        showSuccess('Entry updated successfully')
      }
    } catch (error) {
      console.error('Error updating entry:', error)
      await showError({
        message: 'Failed to update entry',
        type: 'unknown'
      })
      throw error
    }
  }

  // Delete entry (offline-capable)
  static async deleteEntry(entryId: string): Promise<void> {
    const userId = await this.getCurrentUserId()
    const isOnline = await checkNetworkConnection()
    
    try {
      // Mark as deleted in cache
      await OfflineStorage.deleteEntryFromCache(userId, entryId)
      
      if (isOnline && !entryId.startsWith('temp_')) {
        // Try to delete online if not a temp ID
        try {
          const { deleteEntry: firebaseDeleteEntry } = await import('./firebaseService')
          await firebaseDeleteEntry(entryId)
          showSuccess('Entry deleted successfully')
          return
        } catch (onlineError) {
          console.log('Online delete failed, adding to pending:', onlineError)
        }
      }

      // Add to pending operations (unless it's a temp entry)
      if (!entryId.startsWith('temp_')) {
        const cachedEntries = await OfflineStorage.getCachedEntries(userId)
        const deletedEntry = cachedEntries.find(e => e.id === entryId)
        
        if (deletedEntry) {
          const pendingOp: PendingOperation = {
            id: OfflineStorage.generateTempId(),
            type: 'delete',
            data: deletedEntry,
            timestamp: Date.now()
          }
          
          await OfflineStorage.addPendingOperation(userId, pendingOp)
          await OfflineStorage.setSyncStatus(userId, { pendingCount: (await OfflineStorage.getPendingOperations(userId)).length })
        }
      }
      
      if (!isOnline) {
        showSuccess('Entry deleted offline - will sync when online')
      } else {
        showSuccess('Entry deleted (will sync in background)')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      await showError({
        message: 'Failed to delete entry',
        type: 'unknown'
      })
      throw error
    }
  }

  // Get all user entries (offline-first)
  static async getUserEntries(): Promise<Entry[]> {
    const userId = await this.getCurrentUserId()
    
    try {
      // Get from cache first
      const cachedEntries = await OfflineStorage.getCachedEntries(userId)
      
      // Try background sync if online
      const isOnline = await checkNetworkConnection()
      if (isOnline) {
        SyncManager.syncData(userId, false).catch(error => {
          console.log('Background sync failed:', error)
        })
      }
      
      return cachedEntries.filter(entry => !entry.isDeleted)
    } catch (error) {
      console.error('Error getting user entries:', error)
      return []
    }
  }

  // Force sync
  static async forceSync(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()
      await SyncManager.syncData(userId, true)
    } catch (error) {
      console.error('Error forcing sync:', error)
      await showError({
        message: 'Failed to sync data',
        type: 'network'
      })
    }
  }

  // Get sync status
  static async getSyncStatus(): Promise<any> {
    try {
      const userId = await this.getCurrentUserId()
      return await OfflineStorage.getSyncStatus(userId)
    } catch (error) {
      console.error('Error getting sync status:', error)
      return {
        isOnline: false,
        isSyncing: false,
        lastSyncTime: null,
        pendingCount: 0,
        hasConflicts: false
      }
    }
  }

  // Clean up on logout
  static async cleanup(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()
      await OfflineStorage.clearAllUserData(userId)
    } catch (error) {
      console.log('Cleanup error (user might already be logged out):', error)
    }
  }

}