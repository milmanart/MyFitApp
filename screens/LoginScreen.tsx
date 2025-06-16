// MyFitApp/screens/LoginScreen.tsx
import React, { useState, useContext } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native'

// Import from navigation instead of components
import { AuthContext } from '../navigation/AuthContext'
import { useTheme } from '../navigation/ThemeContext'
import { useResponsiveDimensions } from '../hooks/useResponsiveDimensions'
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: { entry?: any; suggestedDateTime?: string; targetMealType?: string; addToExistingMeal?: boolean }
  ProductInfo: { entry: any }
}

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useContext(AuthContext)
  const { theme } = useTheme()
  const { containerPadding, maxContentWidth } = useResponsiveDimensions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    try {
      await signIn(email.trim(), password)
      // Navigation will happen automatically via AuthContext state change
    } catch (e: any) {
      Alert.alert('Login Error', e.message)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: containerPadding,
        maxWidth: maxContentWidth,
        alignSelf: 'center',
        width: '100%'
      }}>
        <Text style={[styles.loginTitle, { marginBottom: 20, color: theme.textColor }]}>Login</Text>
        <View style={styles.loginForm}>
        <TextInput
          style={[
            styles.loginInput,
            { 
              borderColor: theme.border,
              backgroundColor: theme.cardBackground,
              color: theme.textColor 
            }
          ]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[
            styles.loginInput,
            { 
              borderColor: theme.border,
              backgroundColor: theme.cardBackground,
              color: theme.textColor 
            }
          ]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 16 }}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Don't have an account? <Text style={{ fontWeight: 'bold' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
