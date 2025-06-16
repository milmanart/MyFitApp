import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { OfflineDataService } from '../services/offlineDataService'
import { SyncManager } from '../services/syncManager'
import { useNetwork } from '../utils/networkUtils'
import { useTheme } from '../navigation/ThemeContext'

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: number | null
  pendingCount: number
  hasConflicts: boolean
}

export default function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    hasConflicts: false
  })
  const { isConnected } = useNetwork()
  const { theme } = useTheme()

  useEffect(() => {
    loadSyncStatus()
    
    // Set up sync status listener
    const unsubscribe = SyncManager.addSyncListener((status) => {
      setSyncStatus(prev => ({ ...prev, ...status }))
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    // Update online status when network changes
    setSyncStatus(prev => ({ ...prev, isOnline: isConnected }))
    
    // Trigger sync when network comes back online
    if (isConnected && syncStatus.pendingCount > 0) {
      handleManualSync()
    }
  }, [isConnected])

  const loadSyncStatus = async () => {
    try {
      const status = await OfflineDataService.getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const handleManualSync = async () => {
    try {
      await OfflineDataService.forceSync()
      await loadSyncStatus()
    } catch (error) {
      console.error('Error forcing sync:', error)
    }
  }

  const formatLastSyncTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never'
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getStatusColor = (): string => {
    if (!syncStatus.isOnline) return '#ff6b6b'
    if (syncStatus.isSyncing) return '#ffd43b'
    if (syncStatus.pendingCount > 0) return '#ff9500'
    return '#28a745'
  }

  const getStatusText = (): string => {
    if (!syncStatus.isOnline) return 'Offline'
    if (syncStatus.isSyncing) return 'Syncing...'
    if (syncStatus.pendingCount > 0) return `${syncStatus.pendingCount} pending`
    return 'Up to date'
  }

  const getStatusIcon = (): string => {
    if (!syncStatus.isOnline) return '📱'
    if (syncStatus.isSyncing) return '🔄'
    if (syncStatus.pendingCount > 0) return '📤'
    return '✅'
  }

  // Don't show if everything is synced and online
  if (syncStatus.isOnline && syncStatus.pendingCount === 0 && !syncStatus.isSyncing) {
    return null
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: theme.cardBackground,
          borderColor: getStatusColor(),
        }
      ]}
      onPress={handleManualSync}
      disabled={syncStatus.isSyncing || !syncStatus.isOnline}
    >
      <View style={styles.statusRow}>
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: theme.textColor }]}>
            {getStatusText()}
          </Text>
          <Text style={[styles.lastSyncText, { color: theme.textSecondary }]}>
            Last sync: {formatLastSyncTime(syncStatus.lastSyncTime)}
          </Text>
        </View>
        {syncStatus.pendingCount > 0 && syncStatus.isOnline && !syncStatus.isSyncing && (
          <Text style={[styles.tapToSync, { color: theme.primary }]}>
            Tap to sync
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastSyncText: {
    fontSize: 12,
    marginTop: 2,
  },
  tapToSync: {
    fontSize: 12,
    fontWeight: '600',
  },
})