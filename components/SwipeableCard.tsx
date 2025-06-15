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
import { lightHaptic, warningHaptic, errorHaptic } from '../utils/hapticUtils'

interface SwipeableCardProps {
  item: Entry
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25

export default function SwipeableCard({ item, onPress, onEdit, onDelete }: SwipeableCardProps) {
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
        // Swipe left - delete
        toValue = 0
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          translateX.flattenOffset()
          lastOffset.current = 0
          handleDelete()
        })
        return
      } else if (dx > SWIPE_THRESHOLD || vx > 0.5) {
        // Swipe right - edit
        toValue = 0
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          translateX.flattenOffset()
          lastOffset.current = 0
          handleEdit()
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

  const handleDelete = async () => {
    await errorHaptic() // Strong vibration for delete action
    onDelete()
  }

  const handleEdit = async () => {
    await lightHaptic() // Light vibration for edit action
    onEdit()
  }

  // Get current swipe direction and amount for dynamic background
  const getSwipeDirection = () => {
    return translateX._value
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
        {/* Edit action (appears when swiping right) */}
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
          <Text style={styles.swipeActionText}>✏️ Edit</Text>
        </Animated.View>
        
        {/* Delete action (appears when swiping left) */}
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
          <Text style={styles.swipeActionText}>🗑️ Delete</Text>
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
        <TouchableOpacity onPress={async () => {
          await lightHaptic() // Light vibration for card tap
          onPress()
        }} style={{ flex: 1 }}>
          <Text style={[styles.productName, { color: theme.textColor }]}>
            {item.name}
          </Text>
          <Text style={[styles.dateTime, { color: theme.textSecondary }]}>
            {`${dateString} at ${timeString}`}
          </Text>
          <Text style={[styles.calories, { color: '#e53935' }]}>
            {item.calories} kcal
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}