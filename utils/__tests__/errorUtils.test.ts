import { withRetry, showError, showSuccess, showValidationError, handleNetworkError } from '../errorUtils'
import { Alert } from 'react-native'
import Toast from 'react-native-toast-message'
import * as hapticUtils from '../hapticUtils'
import * as networkUtils from '../networkUtils'

// Mock dependencies
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}))

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}))

jest.mock('../hapticUtils', () => ({
  errorHaptic: jest.fn(),
  warningHaptic: jest.fn(),
}))

jest.mock('../networkUtils', () => ({
  checkNetworkConnection: jest.fn(),
}))

const mockToast = Toast as jest.Mocked<typeof Toast>
const mockAlert = Alert as jest.Mocked<typeof Alert>
const mockErrorHaptic = hapticUtils.errorHaptic as jest.MockedFunction<typeof hapticUtils.errorHaptic>
const mockWarningHaptic = hapticUtils.warningHaptic as jest.MockedFunction<typeof hapticUtils.warningHaptic>
const mockCheckNetwork = networkUtils.checkNetworkConnection as jest.MockedFunction<typeof networkUtils.checkNetworkConnection>

describe('errorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')
      
      const result = await withRetry(mockOperation, 3)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValueOnce('success')
      
      const result = await withRetry(mockOperation, 3)
      
      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('always fails'))
      
      await expect(withRetry(mockOperation, 2)).rejects.toThrow('always fails')
      expect(mockOperation).toHaveBeenCalledTimes(3) // initial + 2 retries
    })
  })

  describe('showError', () => {
    it('should show alert by default', async () => {
      await showError({
        message: 'Test error message',
      })

      expect(mockAlert.alert).toHaveBeenCalledWith('Error', 'Test error message')
      expect(mockErrorHaptic).toHaveBeenCalled()
    })

    it('should show toast when specified', async () => {
      await showError({
        title: 'Custom Title',
        message: 'Test error message',
        showAs: 'toast',
      })

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Custom Title',
        text2: 'Test error message',
        position: 'top',
        visibilityTime: 4000,
      })
    })

    it('should use warning haptic for validation errors', async () => {
      await showError({
        message: 'Validation error',
        type: 'validation',
      })

      expect(mockWarningHaptic).toHaveBeenCalled()
      expect(mockErrorHaptic).not.toHaveBeenCalled()
    })
  })

  describe('showSuccess', () => {
    it('should show success toast by default', () => {
      showSuccess('Operation successful')

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Success',
        text2: 'Operation successful',
        position: 'top',
        visibilityTime: 3000,
      })
    })

    it('should show alert when specified', () => {
      showSuccess('Operation successful', 'alert')

      expect(mockAlert.alert).toHaveBeenCalledWith('Success', 'Operation successful')
    })
  })

  describe('handleNetworkError', () => {
    it('should show network error when not connected', async () => {
      mockCheckNetwork.mockResolvedValue(false)

      await handleNetworkError(new Error('Network error'), 'Fallback message')

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'No Internet Connection',
        text2: 'Please check your internet connection and try again.',
        position: 'top',
        visibilityTime: 4000,
      })
    })

    it('should show fallback message when connected but failed', async () => {
      mockCheckNetwork.mockResolvedValue(true)

      await handleNetworkError(new Error('Server error'), 'Custom fallback')

      expect(mockToast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error',
        text2: 'Custom fallback',
        position: 'top',
        visibilityTime: 4000,
      })
    })
  })

  describe('showValidationError', () => {
    it('should show validation error as alert', async () => {
      await showValidationError('Invalid input')

      expect(mockAlert.alert).toHaveBeenCalledWith('Validation Error', 'Invalid input')
      expect(mockWarningHaptic).toHaveBeenCalled()
    })
  })
})