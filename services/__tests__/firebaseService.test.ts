// Basic test for firebaseService.ts
describe('FirebaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Module Import', () => {
    it('should import without errors', () => {
      // Basic smoke test to ensure module loads
      expect(() => {
        require('../firebaseService')
      }).not.toThrow()
    })
  })

  describe('Basic Functions', () => {
    it('should have required auth functions', () => {
      const firebaseService = require('../firebaseService')
      
      expect(typeof firebaseService.signUp).toBe('function')
      expect(typeof firebaseService.signIn).toBe('function')
      expect(typeof firebaseService.signOut).toBe('function')
    })

    it('should have required entry functions', () => {
      const firebaseService = require('../firebaseService')
      
      expect(typeof firebaseService.addEntry).toBe('function')
      expect(typeof firebaseService.getUserEntries).toBe('function')
      expect(typeof firebaseService.updateEntry).toBe('function')
      expect(typeof firebaseService.deleteEntry).toBe('function')
    })
  })
})