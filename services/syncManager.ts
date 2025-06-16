import { OfflineStorage, PendingOperation } from './offlineStorage'
import { 
  addEntry, 
  updateEntry, 
  deleteEntry as firebaseDeleteEntry,
  getUserEntries,
  Entry 
} from './firebaseService'
import { checkNetworkConnection } from '../utils/networkUtils'
import { showError, showSuccess } from '../utils/errorUtils'
import { firestore } from '../firebase'
import { writeBatch, doc, collection, Timestamp } from 'firebase/firestore'

export interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  conflicts: PendingOperation[]
}

export class SyncManager {
  private static isCurrentlySyncing = false
  private static syncListeners: Array<(status: any) => void> = []

  // Add listener for sync status changes
  static addSyncListener(listener: (status: any) => void): () => void {
    this.syncListeners.push(listener)
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener)
    }
  }

  private static notifySyncListeners(status: any): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Error in sync listener:', error)
      }
    })
  }

  // Main sync function
  static async syncData(userId: string, showNotifications = false): Promise<SyncResult> {
    if (this.isCurrentlySyncing) {
      console.log('Sync already in progress, skipping...')
      return { success: false, syncedCount: 0, failedCount: 0, conflicts: [] }
    }

    console.log('Starting data synchronization...')
    this.isCurrentlySyncing = true

    try {
      // Check network connection
      const isOnline = await checkNetworkConnection()
      if (!isOnline) {
        await OfflineStorage.setSyncStatus(userId, { isOnline: false })
        this.notifySyncListeners({ isOnline: false, isSyncing: false })
        return { success: false, syncedCount: 0, failedCount: 0, conflicts: [] }
      }

      // Update sync status
      await OfflineStorage.setSyncStatus(userId, { 
        isOnline: true, 
        isSyncing: true 
      })
      this.notifySyncListeners({ isOnline: true, isSyncing: true })

      // Step 1: Sync remote data to local cache
      await this.syncRemoteToLocal(userId)

      // Step 2: Process pending operations
      const syncResult = await this.processPendingOperations(userId)

      // Step 3: Update sync status
      await OfflineStorage.setSyncStatus(userId, {
        isOnline: true,
        isSyncing: false,
        hasConflicts: syncResult.conflicts.length > 0
      })
      await OfflineStorage.updateLastSyncTime(userId)

      this.notifySyncListeners({ 
        isOnline: true, 
        isSyncing: false,
        hasConflicts: syncResult.conflicts.length > 0,
        pendingCount: syncResult.failedCount
      })

      if (showNotifications) {
        if (syncResult.success && syncResult.syncedCount > 0) {
          showSuccess(`Synced ${syncResult.syncedCount} changes`)
        } else if (syncResult.failedCount > 0) {
          showError({
            message: `Failed to sync ${syncResult.failedCount} changes`,
            type: 'network'
          })
        }
      }

      console.log('Sync completed:', syncResult)
      return syncResult

    } catch (error) {
      console.error('Sync error:', error)
      await OfflineStorage.setSyncStatus(userId, { 
        isOnline: false, 
        isSyncing: false 
      })
      this.notifySyncListeners({ isOnline: false, isSyncing: false })
      return { success: false, syncedCount: 0, failedCount: 0, conflicts: [] }
    } finally {
      this.isCurrentlySyncing = false
    }
  }

  // Sync remote data to local cache while preserving pending changes
  private static async syncRemoteToLocal(userId: string): Promise<void> {
    try {
      console.log('Syncing remote data to local cache...')
      const remoteEntries = await getUserEntries()
      
      // Get current local cache and pending operations
      const localEntries = await OfflineStorage.getCachedEntries(userId)
      const pendingOps = await OfflineStorage.getPendingOperations(userId)
      
      // Create a map of entries that have pending operations
      const pendingEntryIds = new Set(pendingOps.map(op => op.data.id))
      const tempEntryIds = new Set(pendingOps.filter(op => op.tempId).map(op => op.tempId))
      
      // Merge remote entries with local entries that have pending changes
      const mergedEntries = [...remoteEntries]
      
      // Add local entries that don't exist remotely but have pending operations or are temp entries
      for (const localEntry of localEntries) {
        const existsRemotely = remoteEntries.find(remote => remote.id === localEntry.id)
        const hasPendingOperation = localEntry.id && pendingEntryIds.has(localEntry.id)
        const isNewTempEntry = localEntry.id && localEntry.id.startsWith('temp_')
        
        // Check for potential duplicate by content matching (same name, mealType, dateTime, calories)
        const isDuplicateByContent = remoteEntries.find(remote => 
          remote.name === localEntry.name &&
          remote.mealType === localEntry.mealType &&
          remote.dateTime === localEntry.dateTime &&
          remote.calories === localEntry.calories &&
          remote.userId === localEntry.userId
        )
        
        if (!existsRemotely && !isDuplicateByContent && (hasPendingOperation || isNewTempEntry)) {
          mergedEntries.push(localEntry)
          console.log(`Adding local entry ${localEntry.id} (${hasPendingOperation ? 'has pending op' : 'temp entry'})`)
        } else if (isDuplicateByContent && isNewTempEntry) {
          console.log(`Skipping temp entry ${localEntry.id} - duplicate content found in remote entry ${isDuplicateByContent.id}`)
          // Remove the corresponding pending operation for this temp entry
          const tempPendingOp = pendingOps.find(op => op.tempId === localEntry.id || op.data.id === localEntry.id)
          if (tempPendingOp) {
            await OfflineStorage.removePendingOperation(userId, tempPendingOp.id)
            console.log(`Removed pending operation ${tempPendingOp.id} for duplicate temp entry`)
          }
        }
      }
      
      // Preserve local state for entries with pending operations
      for (let i = 0; i < mergedEntries.length; i++) {
        const entry = mergedEntries[i]
        const localEntry = localEntries.find(local => local.id === entry.id)
        
        // If there's a pending operation for this entry, keep the local version
        if (localEntry && pendingEntryIds.has(entry.id)) {
          mergedEntries[i] = localEntry
          console.log(`Preserving local state for entry ${entry.id} (has pending operation)`)
        }
      }
      
      await OfflineStorage.setCachedEntries(userId, mergedEntries)
      console.log(`Merged ${mergedEntries.length} entries (${remoteEntries.length} remote + local changes)`)
    } catch (error) {
      console.error('Error syncing remote to local:', error)
      throw error
    }
  }

  // Process all pending operations using batch writes
  private static async processPendingOperations(userId: string): Promise<SyncResult> {
    const pendingOps = await OfflineStorage.getPendingOperations(userId)
    console.log(`Processing ${pendingOps.length} pending operations`)

    // Remove duplicate operations first
    const uniqueOps = this.removeDuplicateOperations(pendingOps)
    console.log(`After deduplication: ${uniqueOps.length} operations`)

    let syncedCount = 0
    let failedCount = 0
    const conflicts: PendingOperation[] = []

    // Process operations in batches of up to 300 (Firestore limit is 500)
    const batchSize = 300
    for (let i = 0; i < uniqueOps.length; i += batchSize) {
      const batch = uniqueOps.slice(i, i + batchSize)
      const result = await this.processBatchOperations(userId, batch)
      syncedCount += result.syncedCount
      failedCount += result.failedCount
      conflicts.push(...result.conflicts)
    }

    return {
      success: failedCount === 0 && conflicts.length === 0,
      syncedCount,
      failedCount,
      conflicts
    }
  }


  // Remove duplicate operations based on content and timestamp
  private static removeDuplicateOperations(operations: PendingOperation[]): PendingOperation[] {
    const seen = new Map<string, PendingOperation>()
    const validOperations: PendingOperation[] = []
    
    for (const op of operations) {
      // Skip operations with invalid or missing data
      if (!op || !op.data || typeof op.data !== 'object') {
        console.warn('Skipping invalid pending operation:', op)
        continue
      }
      
      // Create a unique key based on operation type and data content
      const dataId = op.data.id || op.tempId || 'unknown'
      const dataName = op.data.name || 'unknown'
      const dataMealType = op.data.mealType || 'unknown'
      const dataDateTime = op.data.dateTime || 'unknown'
      const dataCalories = op.data.calories || 0
      
      const key = `${op.type}:${dataId}:${dataName}:${dataMealType}:${dataDateTime}:${dataCalories}`
      
      // Keep the most recent operation for each unique key
      if (!seen.has(key) || op.timestamp > seen.get(key)!.timestamp) {
        seen.set(key, op)
      }
      
      validOperations.push(op)
    }
    
    return Array.from(seen.values()).sort((a, b) => a.timestamp - b.timestamp)
  }

  // Process operations in batch for atomicity
  private static async processBatchOperations(
    userId: string, 
    operations: PendingOperation[]
  ): Promise<{ syncedCount: number; failedCount: number; conflicts: PendingOperation[] }> {
    
    let syncedCount = 0
    let failedCount = 0
    const conflicts: PendingOperation[] = []
    const batch = writeBatch(firestore)
    const processedOps: PendingOperation[] = []
    const duplicateOps: PendingOperation[] = []

    try {
      // Check for existing entries to prevent duplicates
      const remoteEntries = await getUserEntries()
      
      for (const operation of operations) {
        try {
          const result = await this.prepareBatchOperation(batch, operation, remoteEntries)
          if (result.success) {
            if (result.isDuplicate) {
              duplicateOps.push(operation)
            } else {
              processedOps.push(operation)
            }
          } else if (result.isConflict) {
            conflicts.push(operation)
          } else {
            failedCount++
          }
        } catch (error) {
          console.error(`Failed to prepare operation ${operation.id}:`, error)
          failedCount++
        }
      }

      // Execute batch if there are operations to process
      if (processedOps.length > 0) {
        await batch.commit()
        console.log(`Successfully committed batch with ${processedOps.length} operations`)
      }
      
      // Remove all successful operations (including duplicates)
      const allSuccessfulOps = [...processedOps, ...duplicateOps]
      for (const op of allSuccessfulOps) {
        await OfflineStorage.removePendingOperation(userId, op.id)
        syncedCount++
      }
      
      if (duplicateOps.length > 0) {
        console.log(`Processed ${duplicateOps.length} duplicate operations as successful`)
      }

    } catch (error) {
      console.error('Batch operation failed:', error)
      failedCount += processedOps.length
    }

    return { syncedCount, failedCount, conflicts }
  }

  // Prepare individual operation for batch
  private static async prepareBatchOperation(
    batch: any,
    operation: PendingOperation,
    remoteEntries: Entry[]
  ): Promise<{ success: boolean; isConflict?: boolean; isDuplicate?: boolean }> {
    
    try {
      switch (operation.type) {
        case 'add':
          return this.prepareBatchAddOperation(batch, operation, remoteEntries)
        case 'update':
          return this.prepareBatchUpdateOperation(batch, operation)
        case 'delete':
          return this.prepareBatchDeleteOperation(batch, operation)
        default:
          console.error('Unknown operation type:', operation.type)
          return { success: false }
      }
    } catch (error) {
      console.error(`Error preparing ${operation.type} operation:`, error)
      return { success: false }
    }
  }

  private static prepareBatchAddOperation(
    batch: any,
    operation: PendingOperation,
    remoteEntries: Entry[]
  ): { success: boolean; isConflict?: boolean; isDuplicate?: boolean } {
    
    // Validate operation data
    if (!operation.data || typeof operation.data !== 'object') {
      console.error('Invalid operation data for add operation:', operation)
      return { success: false }
    }
    
    // Check for duplicate by content
    const existingEntry = remoteEntries.find(remote =>
      remote.name === operation.data.name &&
      remote.mealType === operation.data.mealType &&
      remote.dateTime === operation.data.dateTime &&
      remote.calories === operation.data.calories &&
      remote.userId === operation.data.userId
    )
    
    if (existingEntry) {
      console.log(`Entry already exists on server: ${operation.data.name} (ID: ${existingEntry.id})`)
      return { success: true, isDuplicate: true } // Mark as duplicate
    }

    // Add to batch with auto-generated ID
    const entryRef = doc(collection(firestore, 'entries'))
    const entryData = {
      name: operation.data.name,
      mealType: operation.data.mealType,
      dateTime: operation.data.dateTime,
      calories: operation.data.calories,
      userId: operation.data.userId,
      isDeleted: false,
      createdAt: Timestamp.now()
    }

    batch.set(entryRef, entryData)
    console.log(`Prepared add operation for: ${operation.data.name}`)
    return { success: true }
  }

  private static prepareBatchUpdateOperation(
    batch: any,
    operation: PendingOperation
  ): { success: boolean; isConflict?: boolean; isDuplicate?: boolean } {
    
    // Validate operation data
    if (!operation.data || typeof operation.data !== 'object') {
      console.error('Invalid operation data for update operation:', operation)
      return { success: false }
    }
    
    if (!operation.data.id || operation.data.id.startsWith('temp_')) {
      console.log(`Cannot update entry with temp ID: ${operation.data.id}`)
      return { success: false }
    }

    try {
      const entryRef = doc(firestore, 'entries', operation.data.id)
      const updates = {
        name: operation.data.name,
        mealType: operation.data.mealType,
        dateTime: operation.data.dateTime,
        calories: operation.data.calories
      }

      batch.update(entryRef, updates)
      console.log(`Prepared update operation for: ${operation.data.id}`)
      return { success: true }
    } catch (error) {
      console.error(`Failed to prepare update for ${operation.data.id}:`, error)
      return { success: false }
    }
  }

  private static prepareBatchDeleteOperation(
    batch: any,
    operation: PendingOperation
  ): { success: boolean; isConflict?: boolean; isDuplicate?: boolean } {
    
    // Validate operation data
    if (!operation.data || typeof operation.data !== 'object') {
      console.error('Invalid operation data for delete operation:', operation)
      return { success: false }
    }
    
    if (!operation.data.id || operation.data.id.startsWith('temp_')) {
      console.log(`Cannot delete entry with temp ID: ${operation.data.id}`)
      return { success: false }
    }

    try {
      const entryRef = doc(firestore, 'entries', operation.data.id)
      
      // Use soft delete approach
      batch.update(entryRef, {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      })
      
      console.log(`Prepared delete operation for: ${operation.data.id}`)
      return { success: true }
    } catch (error) {
      console.error(`Failed to prepare delete for ${operation.data.id}:`, error)
      return { success: false }
    }
  }

  // Force sync on network recovery
  static async onNetworkRecovered(userId: string): Promise<void> {
    console.log('Network recovered, initiating sync...')
    await this.syncData(userId, true)
  }

  // Get sync status for UI
  static async getSyncStatus(userId: string): Promise<any> {
    return await OfflineStorage.getSyncStatus(userId)
  }

  // Resolve conflicts manually
  static async resolveConflict(
    userId: string, 
    operation: PendingOperation, 
    resolution: 'keep_local' | 'keep_remote' | 'merge'
  ): Promise<boolean> {
    
    try {
      switch (resolution) {
        case 'keep_local':
          // Process the pending operation using batch logic
          try {
            const batchResult = await this.processBatchOperations(userId, [operation])
            if (batchResult.syncedCount > 0) {
              return true
            } else {
              console.log('Failed to process conflict resolution operation')
              return false
            }
          } catch (error) {
            console.error('Error processing conflict resolution:', error)
            return false
          }

        case 'keep_remote':
          // Just remove the pending operation
          await OfflineStorage.removePendingOperation(userId, operation.id)
          return true

        case 'merge':
          // For this app, merge is same as keep_local
          return await this.resolveConflict(userId, operation, 'keep_local')

        default:
          return false
      }
    } catch (error) {
      console.error('Error resolving conflict:', error)
      return false
    }
  }
}