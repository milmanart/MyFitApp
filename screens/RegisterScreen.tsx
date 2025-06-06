// MyFitApp/screens/RegisterScreen.tsx
import React, { useState, useContext } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native'

// Импортируем из navigation вместо components
import { AuthContext } from '../navigation/AuthContext'
import { useTheme } from '../navigation/ThemeContext'
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
  const { signUp } = useContext(AuthContext)
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie pola')
      return
    }
    try {
      await signUp(email.trim(), password)
      navigation.replace('Home')
    } catch (e: any) {
      Alert.alert('Błąd rejestracji', e.message)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.loginTitle, { marginBottom: 20, color: theme.textColor }]}>Rejestracja</Text>
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
          placeholder="Hasło"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
          <Text style={styles.loginButtonText}>Zarejestruj się</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 16 }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Masz już konto? <Text style={{ fontWeight: 'bold' }}>Zaloguj się</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
