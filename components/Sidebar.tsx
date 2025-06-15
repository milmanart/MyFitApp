import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native'
import { useTheme } from '../navigation/ThemeContext'
import { User } from 'firebase/auth'

interface SidebarProps {
  isVisible: boolean
  onClose: () => void
  onLogout: () => void
  onTrashPress: () => void
  onProfilePress: () => void
  user: User | null
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8

export default function Sidebar({ isVisible, onClose, onLogout, onTrashPress, onProfilePress, user }: SidebarProps) {
  const { isDarkMode, toggleTheme, theme } = useTheme()
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current


  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isVisible, slideAnim, overlayOpacity])

  if (!isVisible) return null

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayOpacity }
          ]} 
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme.cardBackground,
          },
        ]}
      >
        <View style={styles.header}>
          {user && (
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => {
                onProfilePress()
                onClose()
              }}
            >
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.displayName, { color: theme.textColor }]}>
                  {user.displayName || 'User'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                  {user.email}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.menuItems}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={toggleTheme}
            >
              <Text style={[styles.menuItemText, { color: theme.textColor }]}>
                🌙 {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                onTrashPress()
                onClose()
              }}
            >
              <Text style={[styles.menuItemText, { color: theme.textColor }]}>
                🗑️ Trash
              </Text>
            </TouchableOpacity>

          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={onLogout}
            >
              <Text style={[styles.menuItemText, { color: '#e53935' }]}>
                🚪 Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  menuItems: {
    flex: 1,
  },
  bottomSection: {
    paddingBottom: 20,
  },
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
})