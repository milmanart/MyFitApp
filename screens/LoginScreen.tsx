// MyFitApp/screens/LoginScreen.tsx
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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useContext(AuthContext)
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie pola')
      return
    }
    try {
      await signIn(email.trim(), password)
      navigation.replace('Home')
    } catch (e: any) {
      Alert.alert('Błąd logowania', e.message)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.loginTitle, { marginBottom: 20, color: theme.textColor }]}>Logowanie</Text>
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
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Zaloguj się</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 16 }}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Nie masz konta? <Text style={{ fontWeight: 'bold' }}>Zarejestruj się</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
