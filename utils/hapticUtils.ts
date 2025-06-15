// Utility functions for haptic feedback
import * as Haptics from 'expo-haptics'

/**
 * Light haptic feedback for button presses and selections
 */
export const lightHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

/**
 * Medium haptic feedback for confirmations and successful actions
 */
export const mediumHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

/**
 * Heavy haptic feedback for important actions and errors
 */
export const heavyHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

/**
 * Success haptic feedback for completed actions
 */
export const successHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

/**
 * Warning haptic feedback for caution actions
 */
export const warningHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

/**
 * Error haptic feedback for failed actions
 */
export const errorHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

/**
 * Selection haptic feedback for UI element selection
 */
export const selectionHaptic = async () => {
  try {
    await Haptics.selectionAsync()
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}