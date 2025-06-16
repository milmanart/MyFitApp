import { useEffect, useRef } from 'react'
import { useNetwork } from '../utils/networkUtils'
import { SyncManager } from '../services/syncManager'
import { OfflineDataService } from '../services/offlineDataService'
import { auth } from '../firebase'

export function useOfflineSync() {
  const { isConnected } = useNetwork()
  const previousConnectionStatus = useRef<boolean>(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleConnectionChange = async () => {
      const wasOffline = !previousConnectionStatus.current
      const isNowOnline = isConnected

      // If we just came back online
      if (wasOffline && isNowOnline) {
        console.log('Network recovered, scheduling sync...')
        
        // Clear any existing timeout
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current)
        }

        // Wait a bit for the connection to stabilize, then sync
        syncTimeoutRef.current = setTimeout(async () => {
          try {
            const user = auth.currentUser
            if (user) {
              await SyncManager.onNetworkRecovered(user.uid)
            }
          } catch (error) {
            console.error('Error syncing after network recovery:', error)
          }
        }, 2000) // 2 second delay
      }

      previousConnectionStatus.current = isConnected
    }

    handleConnectionChange()

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [isConnected])

  // Periodic sync when online
  useEffect(() => {
    if (!isConnected) return

    const periodicSync = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          const syncStatus = await OfflineDataService.getSyncStatus()
          // Only sync if there are pending operations
          if (syncStatus.pendingCount > 0) {
            await SyncManager.syncData(user.uid, false)
          }
        }
      } catch (error) {
        console.log('Periodic sync error:', error)
      }
    }

    // Set up periodic sync every 5 minutes when online
    const interval = setInterval(periodicSync, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isConnected])

  return {
    isOnline: isConnected,
    forceSync: async () => {
      try {
        await OfflineDataService.forceSync()
      } catch (error) {
        console.error('Force sync error:', error)
      }
    }
  }
}