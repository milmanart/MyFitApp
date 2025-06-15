# MyFitApp 🍎

A React Native fitness tracking application built with Expo, TypeScript, and Firebase. Track your meals, manage calorie intake, and maintain a healthy lifestyle with intelligent meal type classification.

## 📱 Features

- **User Authentication**: Secure sign up/sign in with Firebase Auth
- **Meal Tracking**: Add, edit, and delete food entries
- **Smart Meal Classification**: Automatic meal type assignment (breakfast, lunch, dinner, snack) based on time
- **Daily Calorie Overview**: Track total daily calorie consumption
- **Trash Management**: Soft delete with restore functionality
- **Dark/Light Theme**: Toggle between themes with persistent storage
- **Date Navigation**: Browse meals by date with intuitive calendar picker
- **Profile Management**: User profile with account deletion option
- **Haptic Feedback**: Tactile feedback for user interactions and confirmations
- **Error Handling**: Comprehensive error management with network awareness and automatic retry
- **Network Status**: Real-time network connectivity monitoring and offline indicators
- **Toast Notifications**: User-friendly toast messages and alerts for better feedback

## 🚀 Technologies Used

- **Framework**: Expo SDK 53 with React Native 0.79
- **Language**: TypeScript
- **Authentication**: Firebase Auth v11
- **Database**: Firestore
- **Navigation**: React Navigation v7 (Stack Navigator)
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence
- **Testing**: Jest with React Native Testing Library
- **Styling**: React Native StyleSheet with responsive design
- **Native Features**: Haptic feedback for enhanced user experience
- **Error Handling**: React Error Boundaries with centralized error management
- **Network Management**: NetInfo for connectivity monitoring and retry mechanisms
- **User Feedback**: Toast notifications and comprehensive error reporting

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## 🛠 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MyFitApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication and Firestore Database
   - Update `firebase.ts` with your Firebase configuration

4. **Start the development server**
   ```bash
   npm start
   ```

## 📱 Running the App

### Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Reset project
npm run reset-project
```

## 🏗 Project Structure

```
MyFitApp/
├── components/          # Reusable UI components
│   ├── AddButton.tsx
│   ├── DatePickerModal.tsx
│   ├── ErrorBoundary.tsx
│   ├── Sidebar.tsx
│   ├── SwipeableCard.tsx
│   └── TimePickerModal.tsx
├── navigation/          # Navigation and context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── screens/            # Screen components
│   ├── AddProductScreen.tsx
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── ProductInfoScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── RegisterScreen.tsx
│   └── TrashScreen.tsx
├── services/           # Business logic and API calls
│   └── firebaseService.ts
├── styles/            # Shared styles
│   └── styles.ts
├── utils/             # Utility functions
│   ├── mealTypeUtils.ts
│   ├── hapticUtils.ts
│   ├── errorUtils.ts
│   └── networkUtils.ts
├── __tests__/         # Test files
├── App.tsx           # Root component
├── firebase.ts       # Firebase configuration
└── README.md
```

## 🧠 Core Functionality

### Meal Type Classification Algorithm

The app features an intelligent meal classification system that automatically assigns meal types based on time and context:

- **Time-based Rules**: No dinner before 3:00 PM
- **Calorie-based Logic**: Highest calorie meal between breakfast and dinner becomes lunch
- **Time Grouping**: Entries within 30 minutes are grouped as the same meal
- **Dynamic Assignment**: Handles 1-6+ meals per day intelligently

### Authentication Flow

- Secure user registration and login with Firebase Auth
- Password validation and user-friendly error messages
- Profile management with display name updates
- Account deletion with data cleanup

### Data Management

- Real-time data synchronization with Firestore
- Soft delete functionality with restore options
- Date-based filtering and sorting
- Offline-first architecture with local caching

### Error Handling & Recovery

- **React Error Boundaries**: Catch and handle component-level errors gracefully
- **Network Awareness**: Real-time connectivity monitoring with offline indicators
- **Automatic Retry**: Smart retry mechanisms with exponential backoff for failed operations
- **User-Friendly Feedback**: Toast notifications and contextual error messages
- **Graceful Degradation**: Fallback strategies for network failures and API errors
- **Haptic Error Feedback**: Tactile feedback for different types of errors (validation, network, critical)

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: 58 tests covering business logic
- **Integration Tests**: Firebase service interactions
- **Utility Tests**: Meal classification, error handling, and network utilities
- **Coverage**: 70%+ threshold for critical functions

```bash
# Test coverage includes:
# - utils/mealTypeUtils.test.ts (13 tests)
# - services/firebaseService.test.ts (16 tests)
# - utils/hapticUtils.test.ts (10 tests)
# - utils/errorUtils.test.ts (11 tests)
# - utils/networkUtils.test.ts (4 tests)
# - Basic functionality tests (3 tests)
```

## 🎨 UI/UX Features

- **Responsive Design**: Optimized for different screen sizes and orientations
- **Cross-platform**: Consistent experience on iOS and Android
- **Dark/Light Theme**: User preference with system theme support
- **Intuitive Navigation**: Swipe gestures and smooth transitions
- **Accessibility**: Proper accessibility labels and roles

## 🔧 Configuration

### Firebase Setup
Update `firebase.ts` with your configuration:
```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
}
```

### Environment Variables
Create a `.env` file for environment-specific configurations (optional).

## 📈 Performance

- **Optimized Rendering**: Memo hooks and efficient state management
- **Lazy Loading**: On-demand component loading
- **Efficient Queries**: Optimized Firestore queries with proper indexing
- **Bundle Size**: Optimized for production builds

## 🐛 Known Issues

- React Native component tests require additional setup for full coverage
- iOS/Android specific styling may need minor adjustments
- Large datasets may require pagination implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created as part of a React Native development course demonstrating modern mobile app architecture and best practices.

## 🙏 Acknowledgments

- Firebase for backend services
- Expo team for the excellent development platform
- React Navigation for seamless navigation
- React Native Testing Library for testing utilities

---

**Built with ❤️ using React Native and TypeScript**