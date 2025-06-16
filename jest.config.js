// Clean Jest configuration for working tests
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  // Transform React Native modules that use ES6 imports
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@expo|expo-|@react-native-community|@react-native-async-storage)/)',
  ],
  // Mock React Native modules
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^@react-native-community/netinfo$': '<rootDir>/__mocks__/netinfo.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^react-native-toast-message$': '<rootDir>/__mocks__/toast-message.js',
    '^expo-haptics$': '<rootDir>/__mocks__/expo-haptics.js',
  },
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__mocks__/setup.js'],
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 30000,
  verbose: true,
}