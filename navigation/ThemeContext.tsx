import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ThemeContextProps {
  isDarkMode: boolean
  toggleTheme: () => void
  theme: Theme
}

interface Theme {
  backgroundColor: string
  cardBackground: string
  textColor: string
  textSecondary: string
  primary: string
  border: string
}

const lightTheme: Theme = {
  backgroundColor: '#f2f2f2',
  cardBackground: '#fff',
  textColor: '#000',
  textSecondary: '#666',
  primary: '#3478f6',
  border: '#ccc',
}

const darkTheme: Theme = {
  backgroundColor: '#333',
  cardBackground: '#444',
  textColor: '#fff',
  textSecondary: '#ccc',
  primary: '#3478f6',
  border: '#555',
}

const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
})

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme')
        if (storedTheme !== null) {
          setIsDarkMode(JSON.parse(storedTheme))
        }
      } catch (error) {
        console.log('Error loading theme:', error)
      }
    }
    loadTheme()
  }, [])

  const toggleTheme = async () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    try {
      await AsyncStorage.setItem('theme', JSON.stringify(newTheme))
    } catch (error) {
      console.log('Error saving theme:', error)
    }
  }

  const theme = isDarkMode ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}