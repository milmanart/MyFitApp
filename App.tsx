// MyFitApp/App.tsx

import React, { useContext } from "react"

// Important: initialize Firebase immediately when app starts
import "./firebase"

import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { View, ActivityIndicator } from "react-native"
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { AuthProvider, AuthContext } from "./navigation/AuthContext"
import { ThemeProvider, useTheme } from "./navigation/ThemeContext"
import ErrorBoundary from "./components/ErrorBoundary"

import LoginScreen from "./screens/LoginScreen"
import RegisterScreen from "./screens/RegisterScreen"
import HomeScreen from "./screens/HomeScreen"
import AddProductScreen from "./screens/AddProductScreen"
import ProductInfoScreen from "./screens/ProductInfoScreen"
import ProfileScreen from "./screens/ProfileScreen"
import TrashScreen from "./screens/TrashScreen"
import type { Entry } from "./services/firebaseService"

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: { entry?: Entry; suggestedDateTime?: string; targetMealType?: string; addToExistingMeal?: boolean }
  ProductInfo: { entry: Entry }
  Profile: undefined
  Trash: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

// Component to handle conditional navigation based on auth state
function AppNavigator() {
  const { user, loading } = useContext(AuthContext)
  const { theme } = useTheme()

  console.log("AppNavigator render - loading:", loading, "user:", user ? `${user.email} (${user.uid})` : "null")

  // Show loading screen while checking auth state
  if (loading) {
    console.log("AppNavigator: Showing loading screen")
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: theme.backgroundColor 
      }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  console.log("AppNavigator: Rendering navigation with user:", user ? "authenticated" : "not authenticated")

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "Home" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          // Authenticated user screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="ProductInfo" component={ProductInfoScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Trash" component={TrashScreen} />
          </>
        ) : (
          // Unauthenticated user screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <AppNavigator />
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
