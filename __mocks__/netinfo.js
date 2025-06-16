// Mock for @react-native-community/netinfo
module.exports = {
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()), // Returns unsubscribe function
    fetch: jest.fn(() => Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })),
    useNetInfo: jest.fn(() => ({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })),
  }
}