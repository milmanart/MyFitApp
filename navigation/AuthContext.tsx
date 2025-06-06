// MyFitApp/navigation/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthContextProps {
  user: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // При инициализации проверяем, есть ли сохранённый currentUser
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const stored = await AsyncStorage.getItem('currentUser')
        if (stored) {
          setUser(stored)
        }
      } catch {
        // Игнорируем ошибки
      } finally {
        setLoading(false)
      }
    }
    loadStoredUser()
  }, [])

  const signIn = async (email: string, password: string) => {
    const usersJson = await AsyncStorage.getItem('users')
    const users = usersJson ? JSON.parse(usersJson) : {}

    if (users[email] && users[email].password === password) {
      await AsyncStorage.setItem('currentUser', email)
      setUser(email)
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const signUp = async (email: string, password: string) => {
    const usersJson = await AsyncStorage.getItem('users')
    const users = usersJson ? JSON.parse(usersJson) : {}

    if (users[email]) {
      throw new Error('User already exists')
    }

    users[email] = { password }
    await AsyncStorage.setItem('users', JSON.stringify(users))
    await AsyncStorage.setItem('currentUser', email)
    setUser(email)
  }

  const signOut = async () => {
    await AsyncStorage.removeItem('currentUser')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
