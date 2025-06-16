import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import { PendingOperation } from '../services/offlineStorage'
import { SyncManager } from '../services/syncManager'
import { useTheme } from '../navigation/ThemeContext'
import { showSuccess, showError } from '../utils/errorUtils'

interface ConflictResolutionModalProps {
  visible: boolean
  conflicts: PendingOperation[]
  onClose: () => void
  onResolved: () => void
}

export default function ConflictResolutionModal({
  visible,
  conflicts,
  onClose,
  onResolved,
}: ConflictResolutionModalProps) {
  const [resolving, setResolving] = useState(false)
  const { theme } = useTheme()

  const handleResolveConflict = async (
    operation: PendingOperation,
    resolution: 'keep_local' | 'keep_remote'
  ) => {
    try {
      setResolving(true)
      
      // For this implementation, we'll resolve all conflicts with the same strategy
      const success = await SyncManager.resolveConflict(
        operation.data.userId,
        operation,
        resolution
      )

      if (success) {
        showSuccess('Conflict resolved successfully')
        onResolved()
      } else {
        await showError({
          message: 'Failed to resolve conflict',
          type: 'unknown'
        })
      }
    } catch (error) {
      console.error('Error resolving conflict:', error)
      await showError({
        message: 'Failed to resolve conflict',
        type: 'unknown'
      })
    } finally {
      setResolving(false)
    }
  }

  const handleResolveAll = (resolution: 'keep_local' | 'keep_remote') => {
    Alert.alert(
      'Resolve All Conflicts',
      `Are you sure you want to ${resolution === 'keep_local' ? 'keep all local changes' : 'discard all local changes'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: resolution === 'keep_remote' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setResolving(true)
              let resolvedCount = 0
              
              for (const conflict of conflicts) {
                const success = await SyncManager.resolveConflict(
                  conflict.data.userId,
                  conflict,
                  resolution
                )
                if (success) resolvedCount++
              }
              
              if (resolvedCount === conflicts.length) {
                showSuccess('All conflicts resolved')
                onResolved()
              } else {
                await showError({
                  message: `Resolved ${resolvedCount}/${conflicts.length} conflicts`,
                  type: 'unknown'
                })
              }
            } catch (error) {
              console.error('Error resolving all conflicts:', error)
              await showError({
                message: 'Failed to resolve conflicts',
                type: 'unknown'
              })
            } finally {
              setResolving(false)
            }
          }
        }
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (conflicts.length === 0) {
    return null
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            Sync Conflicts
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: theme.primary }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          The following changes couldn't be synced automatically. Choose how to resolve each conflict:
        </Text>

        <ScrollView style={styles.scrollView}>
          {conflicts.map((conflict, index) => (
            <View
              key={conflict.id}
              style={[
                styles.conflictItem,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                }
              ]}
            >
              <View style={styles.conflictHeader}>
                <Text style={[styles.conflictType, { color: theme.textColor }]}>
                  {conflict.type.toUpperCase()} - {conflict.data.name}
                </Text>
                <Text style={[styles.conflictDate, { color: theme.textSecondary }]}>
                  {formatDate(conflict.data.dateTime)}
                </Text>
              </View>

              <View style={styles.conflictDetails}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Meal: {conflict.data.mealType} • Calories: {conflict.data.calories}
                </Text>
              </View>

              <View style={styles.conflictActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.keepLocalButton]}
                  onPress={() => handleResolveConflict(conflict, 'keep_local')}
                  disabled={resolving}
                >
                  <Text style={styles.keepLocalText}>Keep Local</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.keepRemoteButton]}
                  onPress={() => handleResolveConflict(conflict, 'keep_remote')}
                  disabled={resolving}
                >
                  <Text style={styles.keepRemoteText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bulkButton, styles.keepAllLocalButton]}
            onPress={() => handleResolveAll('keep_local')}
            disabled={resolving}
          >
            <Text style={styles.bulkButtonText}>Keep All Local Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bulkButton, styles.discardAllButton]}
            onPress={() => handleResolveAll('keep_remote')}
            disabled={resolving}
          >
            <Text style={styles.bulkButtonText}>Discard All Local Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  conflictItem: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  conflictHeader: {
    marginBottom: 8,
  },
  conflictType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conflictDate: {
    fontSize: 12,
  },
  conflictDetails: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  keepLocalButton: {
    backgroundColor: '#28a745',
  },
  keepRemoteButton: {
    backgroundColor: '#dc3545',
  },
  keepLocalText: {
    color: '#fff',
    fontWeight: '600',
  },
  keepRemoteText: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bulkButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  keepAllLocalButton: {
    backgroundColor: '#28a745',
  },
  discardAllButton: {
    backgroundColor: '#dc3545',
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})