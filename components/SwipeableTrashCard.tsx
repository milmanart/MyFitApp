import React, { useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native'
import { useTheme } from '../navigation/ThemeContext'
import type { Entry } from '../services/firebaseService'
import styles from '../styles/styles'

interface SwipeableTrashCardProps {
  item: Entry
  onPress: () => void
  onRestore: () => void
  onPermanentDelete: () => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25

export default function SwipeableTrashCard({ item, onPress, onRestore, onPermanentDelete }: SwipeableTrashCardProps) {
  const { theme } = useTheme()
  const translateX = useRef(new Animated.Value(0)).current
  const lastOffset = useRef(0)

  const dt = new Date(item.dateTime)
  const timeString = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateString = dt.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const deletedDate = item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('en-US') : ''

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10
    },
    onPanResponderGrant: () => {
      translateX.setOffset(lastOffset.current)
      translateX.setValue(0)
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx)
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, vx } = gestureState
      let toValue = 0

      if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
        // Swipe left - delete permanently
        toValue = 0
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          translateX.flattenOffset()
          lastOffset.current = 0
          handlePermanentDelete()
        })
        return
      } else if (dx > SWIPE_THRESHOLD || vx > 0.5) {
        // Swipe right - restore
        toValue = 0
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          translateX.flattenOffset()
          lastOffset.current = 0
          handleRestore()
        })
        return
      }

      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        translateX.flattenOffset()
        lastOffset.current = 0
      })
    },
  })

  const handlePermanentDelete = () => {
    Alert.alert(
      'Permanently Delete',
      `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: onPermanentDelete
        },
      ]
    )
  }

  const handleRestore = () => {
    onRestore()
  }

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Dynamic background that appears only when swiping */}
      <Animated.View 
        style={[
          styles.swipeBackground,
          {
            opacity: translateX.interpolate({
              inputRange: [-SCREEN_WIDTH, -50, 0, 50, SCREEN_WIDTH],
              outputRange: [1, 1, 0, 1, 1],
              extrapolate: 'clamp'
            })
          }
        ]}
      >
        {/* Restore action (appears when swiping right) */}
        <Animated.View 
          style={[
            styles.swipeAction,
            styles.swipeActionLeft,
            { 
              backgroundColor: '#4CAF50',
              opacity: translateX.interpolate({
                inputRange: [0, 50, SCREEN_WIDTH],
                outputRange: [0, 1, 1],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Text style={styles.swipeActionText}>↩️ Restore</Text>
        </Animated.View>
        
        {/* Delete forever action (appears when swiping left) */}
        <Animated.View 
          style={[
            styles.swipeAction,
            styles.swipeActionRight,
            { 
              backgroundColor: '#f44336',
              opacity: translateX.interpolate({
                inputRange: [-SCREEN_WIDTH, -50, 0],
                outputRange: [1, 1, 0],
                extrapolate: 'clamp'
              })
            }
          ]}
        >
          <Text style={styles.swipeActionText}>🗑️ Delete Forever</Text>
        </Animated.View>
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          { 
            backgroundColor: theme.cardBackground,
            transform: [{ translateX }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
          <Text style={[styles.productName, { color: theme.textColor, opacity: 0.7 }]}>
            {item.name}
          </Text>
          <Text style={[styles.dateTime, { color: theme.textSecondary }]}>
            {`${dateString} at ${timeString}`}
          </Text>
          <Text style={[styles.calories, { color: '#e53935', opacity: 0.7 }]}>
            {item.calories} kcal
          </Text>
          {deletedDate && (
            <Text style={[{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }]}>
              Deleted on {deletedDate}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}