import NetInfo from '@react-native-community/netinfo'
import { checkNetworkConnection } from '../networkUtils'

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}))

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>

describe('networkUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkNetworkConnection', () => {
    it('should return true when connected', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any)

      const result = await checkNetworkConnection()
      
      expect(result).toBe(true)
      expect(mockNetInfo.fetch).toHaveBeenCalled()
    })

    it('should return false when not connected', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any)

      const result = await checkNetworkConnection()
      
      expect(result).toBe(false)
    })

    it('should return false when NetInfo throws error', async () => {
      mockNetInfo.fetch.mockRejectedValue(new Error('NetInfo error'))
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const result = await checkNetworkConnection()
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Error checking network connection:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle null isConnected value', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: null,
        isInternetReachable: null,
        type: 'unknown',
      } as any)

      const result = await checkNetworkConnection()
      
      expect(result).toBe(false)
    })
  })
})