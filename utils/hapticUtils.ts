import * as Haptics from 'expo-haptics'

export const lightHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

export const mediumHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

export const heavyHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

export const successHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

export const warningHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

export const errorHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}

export const selectionHaptic = async () => {
  try {
    await Haptics.selectionAsync()
  } catch (error) {
    console.log('Haptic feedback not available:', error)
  }
}