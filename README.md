# MyFitApp

A comprehensive React Native fitness tracking application that allows users to log their meals, track nutrition, and manage their fitness data with offline capabilities.

## Features

### Core Functionality
- **User Authentication**: Secure login and registration with Firebase Auth
- **Meal Tracking**: Log food items with calories and meal types (breakfast, lunch, dinner, snack)
- **Offline Support**: Full offline functionality with automatic sync when connection is restored
- **Data Management**: Add, edit, delete, and view food entries
- **Trash System**: Soft delete with recovery options

### User Interface
- **Responsive Design**: Optimized for both portrait and landscape orientations
- **Dark/Light Theme**: Built-in theme switching
- **Swipe Gestures**: Intuitive swipe-to-delete and swipe-to-edit functionality
- **Date/Time Pickers**: Easy meal timing selection
- **Toast Notifications**: User feedback for actions and errors

### Technical Features
- **Real-time Sync**: Automatic synchronization with Firebase Firestore
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Haptic Feedback**: Enhanced user experience with tactile feedback
- **Network Detection**: Automatic handling of online/offline states
- **Data Persistence**: Local storage with AsyncStorage for offline usage

## Technology Stack

- **Framework**: React Native with Expo (~53.0.10)
- **Language**: TypeScript
- **Navigation**: React Navigation v7
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **State Management**: React Context API
- **Storage**: AsyncStorage for offline data
- **Testing**: Jest with React Native Testing Library

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MyFitApp
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication and Firestore
   - Update the configuration in `firebase.ts` with your project details

## Running the App

### Development
```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality
```bash
# Run linter
npm run lint
```

## Project Structure

```
MyFitApp/
├── components/          # Reusable UI components
│   ├── AddButton.tsx
│   ├── DatePickerModal.tsx
│   ├── MealTypePickerModal.tsx
│   ├── Sidebar.tsx
│   ├── SwipeableCard.tsx
│   └── SyncStatusIndicator.tsx
├── hooks/               # Custom React hooks
│   ├── useOfflineSync.ts
│   ├── useOrientation.ts
│   └── useResponsiveDimensions.ts
├── navigation/          # Navigation and context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── screens/             # Application screens
│   ├── AddProductScreen.tsx
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── ProductInfoScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── RegisterScreen.tsx
│   └── TrashScreen.tsx
├── services/            # Business logic and data services
│   ├── firebaseService.ts
│   ├── offlineDataService.ts
│   ├── offlineStorage.ts
│   └── syncManager.ts
├── utils/               # Utility functions
│   ├── errorUtils.ts
│   ├── hapticUtils.ts
│   ├── mealTypeUtils.ts
│   └── networkUtils.ts
└── styles/              # Styling
    └── styles.ts
```

## Key Components

### Services
- **FirebaseService**: Handles all Firebase operations (auth, database)
- **OfflineDataService**: Manages offline data operations and local storage
- **SyncManager**: Coordinates data synchronization between local and remote storage

### Screens
- **HomeScreen**: Main dashboard displaying meal entries with filtering and search
- **AddProductScreen**: Form for adding/editing food entries
- **LoginScreen/RegisterScreen**: Authentication screens
- **TrashScreen**: Manages deleted items with restore functionality
- **ProfileScreen**: User profile and app settings

### Components
- **SwipeableCard**: Interactive cards with swipe gestures for entries
- **SyncStatusIndicator**: Shows current sync status and network connectivity
- **DatePickerModal/TimePickerModal**: Date and time selection modals

## Offline Functionality

The app provides full offline capabilities:
- Data is stored locally using AsyncStorage
- All operations work offline (create, read, update, delete)
- Automatic sync when network connection is restored
- Conflict resolution for data synchronization
- Visual indicators for sync status

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use meaningful commit messages
- Ensure code passes linting before committing
- Test offline functionality thoroughly

## License

This project is private and proprietary.

## Support

If you encounter any issues or have questions, please check the troubleshooting section or create an issue in the project repository.