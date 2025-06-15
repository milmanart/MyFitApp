import Toast from 'react-native-toast-message'
import { Alert } from 'react-native'
import { errorHaptic, warningHaptic } from './hapticUtils'
import { checkNetworkConnection } from './networkUtils'

export type ErrorType = 'network' | 'validation' | 'server' | 'unknown'
export type NotificationType = 'alert' | 'toast'

export interface ErrorOptions {
  title?: string
  message: string
  type?: ErrorType
  showAs?: NotificationType
  enableHaptic?: boolean
}

// Simple error handler that can show either Alert or Toast
export const showError = async (options: ErrorOptions) => {
  const {
    title = 'Error',
    message,
    type = 'unknown',
    showAs = 'alert',
    enableHaptic = true
  } = options

  // Provide haptic feedback based on error type
  if (enableHaptic) {
    switch (type) {
      case 'network':
        await warningHaptic()
        break
      case 'validation':
        await warningHaptic()
        break
      default:
        await errorHaptic()
        break
    }
  }

  // Show notification based on preference
  if (showAs === 'toast') {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    })
  } else {
    Alert.alert(title, message)
  }
}

// Simple success notification
export const showSuccess = (message: string, showAs: NotificationType = 'toast') => {
  if (showAs === 'toast') {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    })
  } else {
    Alert.alert('Success', message)
  }
}

// Network-aware error handler
export const handleNetworkError = async (error: any, fallbackMessage: string = 'Network error occurred') => {
  const isConnected = await checkNetworkConnection()
  
  if (!isConnected) {
    await showError({
      title: 'No Internet Connection',
      message: 'Please check your internet connection and try again.',
      type: 'network',
      showAs: 'toast'
    })
    return
  }

  // If connected but still failed, show the fallback message
  await showError({
    message: fallbackMessage,
    type: 'server',
    showAs: 'toast'
  })
}

// Simple retry mechanism for async operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt <= maxRetries) {
        console.log(`Retry attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        delayMs *= 1.5 // Simple exponential backoff
      }
    }
  }

  throw lastError
}

// Validation error helper
export const showValidationError = async (message: string) => {
  await showError({
    title: 'Validation Error',
    message,
    type: 'validation',
    showAs: 'alert'
  })
}