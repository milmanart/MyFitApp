# Local Storage & Caching

## Overview

The app uses **AsyncStorage** for local data persistence to provide a seamless user experience across app restarts.

## What is Cached

### 1. **Theme Preferences**
- **Key**: `theme`
- **Data**: Boolean (true for dark mode, false for light mode)
- **Purpose**: Preserves user's theme choice between app launches

### 2. **Authentication State**
- **Keys**: 
  - `auth_state`: 'authenticated' | null
  - `auth_user`: Minimal user data (uid, email, etc.)
- **Purpose**: Enables instant app startup without re-authentication
- **Strategy**: Hybrid approach combining AsyncStorage cache + Firebase Auth persistence

## How it Works

### Theme Persistence
```typescript
// Saving theme
await AsyncStorage.setItem('theme', JSON.stringify(isDarkMode))

// Loading theme on startup
const storedTheme = await AsyncStorage.getItem('theme')
if (storedTheme !== null) {
  setIsDarkMode(JSON.parse(storedTheme))
}
```

### Auth State Caching (Hybrid Approach)
```typescript
// 1. Load cached state for instant UI
const cachedAuthState = await AsyncStorage.getItem('auth_state')
const cachedUser = await AsyncStorage.getItem('auth_user')
if (cachedAuthState === 'authenticated' && cachedUser) {
  setUser(JSON.parse(cachedUser)) // Instant UI
}

// 2. Firebase Auth verification (authoritative)
onAuthStateChanged(auth, async (firebaseUser) => {
  setUser(firebaseUser) // Override with real auth state
  
  // Update cache
  if (firebaseUser) {
    await AsyncStorage.setItem('auth_state', 'authenticated')
    await AsyncStorage.setItem('auth_user', JSON.stringify({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      // ... minimal data only
    }))
  } else {
    await AsyncStorage.removeItem('auth_state')
    await AsyncStorage.removeItem('auth_user')
  }
})
```

## App Startup Flow

1. **Theme Loading**: Theme preference loaded immediately from AsyncStorage
2. **Cached Auth Check**: Cached auth state loaded for instant UI display
3. **Firebase Auth Setup**: Firebase Auth with React Native persistence initialized
4. **Firebase Verification**: Firebase verifies actual auth state (authoritative)
5. **Navigation Decision**: App navigates to Home or Login based on real auth state
6. **Cache Update**: AsyncStorage updated with current Firebase auth state

### Key Benefits of Hybrid Approach:
- ✅ **Instant UI**: No white screen, immediate navigation
- ✅ **Reliable Auth**: Firebase Auth is authoritative source
- ✅ **Automatic Sync**: Cache always matches Firebase state  
- ✅ **Offline Resilience**: Works even when Firebase is slow to load

## Cache Management

### Automatic Cleanup
- Auth cache cleared on logout
- Invalid cache handled gracefully with fallbacks

### Manual Cache Clearing
- Available in sidebar menu: **"🗑️ Clear Cache"**
- Clears all AsyncStorage data
- Requires confirmation dialog
- Resets app to initial state

## Benefits

### ✅ **Instant Startup**
- No white screen while checking auth
- Theme applied immediately
- Smooth user experience

### ✅ **Offline Resilience**
- Theme persists without internet
- Auth state preserved across restarts
- Graceful degradation

### ✅ **Performance**
- Reduces Firebase auth check delay
- Minimizes UI reflow
- Faster perceived loading

## Technical Implementation

### Dependencies
- `@react-native-async-storage/async-storage`: Local storage
- `firebase/auth`: Auth state persistence (built-in)

### Error Handling
- Try-catch blocks for all AsyncStorage operations
- Console logging for debugging
- Graceful fallbacks to default states

### Storage Locations
- **iOS**: Documents directory
- **Android**: Shared preferences or SQLite
- **Web**: localStorage

## Best Practices

1. **Always use try-catch** for AsyncStorage operations
2. **Provide fallbacks** for missing or corrupted data
3. **Clear sensitive data** on logout
4. **Validate cached data** before using
5. **Handle storage quota limits** gracefully

## Debugging

To check current cache state:
1. Open React Native debugger
2. Check console logs for cache operations
3. Use "Clear Cache" button for testing
4. Monitor auth state changes in console

## Future Enhancements

- **Entry caching**: Cache recent entries for offline viewing
- **Image caching**: Store user profile images locally  
- **Settings persistence**: Save additional user preferences
- **Sync indicators**: Show when data is cached vs live