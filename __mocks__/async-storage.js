// Mock for @react-native-async-storage/async-storage
// Create an in-memory storage that persists during tests
const storage = {}

module.exports = {
  __esModule: true,
  default: {
    getItem: jest.fn((key) => {
      return Promise.resolve(storage[key] || null)
    }),
    setItem: jest.fn((key, value) => {
      storage[key] = value
      return Promise.resolve()
    }),
    removeItem: jest.fn((key) => {
      delete storage[key]
      return Promise.resolve()
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
      return Promise.resolve()
    }),
    getAllKeys: jest.fn(() => {
      return Promise.resolve(Object.keys(storage))
    }),
    multiGet: jest.fn((keys) => {
      return Promise.resolve(keys.map(key => [key, storage[key] || null]))
    }),
    multiSet: jest.fn((keyValuePairs) => {
      keyValuePairs.forEach(([key, value]) => {
        storage[key] = value
      })
      return Promise.resolve()
    }),
    multiRemove: jest.fn((keys) => {
      keys.forEach(key => delete storage[key])
      return Promise.resolve()
    }),
  }
}