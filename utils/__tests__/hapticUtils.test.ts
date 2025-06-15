// Test file for hapticUtils.ts
import {
  lightHaptic,
  mediumHaptic,
  heavyHaptic,
  successHaptic,
  warningHaptic,
  errorHaptic,
  selectionHaptic,
} from '../hapticUtils'

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}))

import * as Haptics from 'expo-haptics'

const mockImpactAsync = Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>
const mockNotificationAsync = Haptics.notificationAsync as jest.MockedFunction<typeof Haptics.notificationAsync>
const mockSelectionAsync = Haptics.selectionAsync as jest.MockedFunction<typeof Haptics.selectionAsync>

describe('hapticUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Impact Feedback', () => {
    it('should call light haptic feedback', async () => {
      mockImpactAsync.mockResolvedValue()

      await lightHaptic()

      expect(mockImpactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })

    it('should call medium haptic feedback', async () => {
      mockImpactAsync.mockResolvedValue()

      await mediumHaptic()

      expect(mockImpactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
    })

    it('should call heavy haptic feedback', async () => {
      mockImpactAsync.mockResolvedValue()

      await heavyHaptic()

      expect(mockImpactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy)
    })

    it('should handle haptic errors gracefully for impact', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      mockImpactAsync.mockRejectedValue(new Error('Haptic not available'))

      await lightHaptic()

      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Notification Feedback', () => {
    it('should call success haptic feedback', async () => {
      mockNotificationAsync.mockResolvedValue()

      await successHaptic()

      expect(mockNotificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success)
    })

    it('should call warning haptic feedback', async () => {
      mockNotificationAsync.mockResolvedValue()

      await warningHaptic()

      expect(mockNotificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning)
    })

    it('should call error haptic feedback', async () => {
      mockNotificationAsync.mockResolvedValue()

      await errorHaptic()

      expect(mockNotificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error)
    })

    it('should handle haptic errors gracefully for notifications', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      mockNotificationAsync.mockRejectedValue(new Error('Haptic not available'))

      await successHaptic()

      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Selection Feedback', () => {
    it('should call selection haptic feedback', async () => {
      mockSelectionAsync.mockResolvedValue()

      await selectionHaptic()

      expect(mockSelectionAsync).toHaveBeenCalled()
    })

    it('should handle haptic errors gracefully for selection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      mockSelectionAsync.mockRejectedValue(new Error('Haptic not available'))

      await selectionHaptic()

      expect(consoleSpy).toHaveBeenCalledWith('Haptic feedback not available:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should not throw errors when haptic is unavailable', async () => {
      mockImpactAsync.mockRejectedValue(new Error('Device does not support haptics'))
      mockNotificationAsync.mockRejectedValue(new Error('Device does not support haptics'))
      mockSelectionAsync.mockRejectedValue(new Error('Device does not support haptics'))

      // All these should complete without throwing
      await expect(lightHaptic()).resolves.toBeUndefined()
      await expect(successHaptic()).resolves.toBeUndefined()
      await expect(selectionHaptic()).resolves.toBeUndefined()
    })
  })
})