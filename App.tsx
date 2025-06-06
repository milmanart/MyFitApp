// MyFitApp/App.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

// Импортируем AuthProvider и ThemeProvider из папки navigation
import { AuthProvider } from './navigation/AuthContext'
import { ThemeProvider } from './navigation/ThemeContext'

import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import HomeScreen from './screens/HomeScreen'
import AddProductScreen from './screens/AddProductScreen'

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  )
}
