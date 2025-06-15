// MyFitApp/navigation/AuthContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth } from "../firebase"
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
} from "../services/firebaseService"

// Keys for AsyncStorage
const AUTH_USER_KEY = 'auth_user'
const AUTH_STATE_KEY = 'auth_state'

interface AuthContextProps {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load cached auth state for instant UI
  useEffect(() => {
    const loadCachedAuth = async () => {
      try {
        console.log("Loading cached auth state...")
        const cachedAuthState = await AsyncStorage.getItem(AUTH_STATE_KEY)
        const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY)
        
        if (cachedAuthState === 'authenticated' && cachedUser) {
          console.log("Found cached authenticated user")
          const parsedUser = JSON.parse(cachedUser)
          setUser(parsedUser)
        } else {
          console.log("No cached auth state found")
        }
      } catch (error) {
        console.log('Error loading cached auth:', error)
      }
    }

    loadCachedAuth()
  }, [])

  useEffect(() => {
    console.log("Setting up Firebase auth state listener...")

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Firebase auth state changed:",
        firebaseUser ? `User logged in: ${firebaseUser.email}` : "User logged out"
      )
      
      setUser(firebaseUser)
      setLoading(false)

      // Cache auth state
      try {
        if (firebaseUser) {
          console.log("Caching authenticated user state")
          await AsyncStorage.setItem(AUTH_STATE_KEY, 'authenticated')
          // Store minimal user data to avoid serialization issues
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
        } else {
          console.log("Clearing cached auth state")
          await AsyncStorage.removeItem(AUTH_STATE_KEY)
          await AsyncStorage.removeItem(AUTH_USER_KEY)
        }
      } catch (error) {
        console.log('Error caching auth state:', error)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    await firebaseSignIn(email, password)
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    await firebaseSignUp(email, password, displayName)
  }

  const signOut = async () => {
    await firebaseSignOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
