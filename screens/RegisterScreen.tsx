// MyFitApp/screens/RegisterScreen.tsx
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
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: { entry?: any; suggestedDateTime?: string; targetMealType?: string; addToExistingMeal?: boolean }
  ProductInfo: { entry: any }
}

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
  const { signUp } = useContext(AuthContext)
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const handleRegister = async () => {
    if (!email.trim() || !password || !displayName.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    try {
      await signUp(email.trim(), password, displayName.trim())
      // Navigation will happen automatically via AuthContext state change
    } catch (e: any) {
      Alert.alert('Registration Error', e.message)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.loginTitle, { marginBottom: 20, color: theme.textColor }]}>Register</Text>
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
          placeholder="Display Name"
          placeholderTextColor={theme.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
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
        <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
          <Text style={styles.loginButtonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 16 }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Already have an account? <Text style={{ fontWeight: 'bold' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
