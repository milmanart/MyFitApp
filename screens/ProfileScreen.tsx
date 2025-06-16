import React, { useState, useContext } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { useTheme } from '../navigation/ThemeContext'
import { AuthContext } from '../navigation/AuthContext'
import { useResponsiveDimensions } from '../hooks/useResponsiveDimensions'
import { updateUserProfile, deleteUserAccount } from '../services/firebaseService'
import { RootStackParamList } from '../App'

type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { theme } = useTheme()
  const { user } = useContext(AuthContext)
  const { containerPadding, maxContentWidth } = useResponsiveDimensions()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  const handleSave = async () => {
    try {
      const trimmedDisplayName = displayName.trim()
      
      if (trimmedDisplayName !== (user?.displayName || '')) {
        await updateUserProfile(trimmedDisplayName)
      }
      
      setIsEditing(false)
    } catch (error: any) {
      console.error('Profile update error:', error)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName || '')
    setEmail(user?.email || '')
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long')
      return
    }

    try {
      if (!user || !user.email) {
        Alert.alert('Error', 'User not found')
        return
      }

      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      
      // Update password
      await updatePassword(user, newPassword)
      
      Alert.alert('Success', 'Password updated successfully')
      setShowPasswordChange(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Password change error:', error)
      let errorMessage = 'Failed to update password. Please try again.'
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak'
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign in again, then try changing your password'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.'
      }
      
      Alert.alert('Error', errorMessage)
    }
  }

  const cancelPasswordChange = () => {
    setShowPasswordChange(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm account deletion')
      return
    }

    try {
      await deleteUserAccount(deletePassword)
      // The user will be automatically signed out and redirected by AuthContext
    } catch (error: any) {
      console.error('Delete account error:', error)
      Alert.alert('Error', error.message || 'Failed to delete account. Please try again.')
    }
  }

  const cancelDeleteAccount = () => {
    setShowDeleteAccount(false)
    setDeletePassword('')
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: containerPadding,
          maxWidth: maxContentWidth,
          alignSelf: 'center',
          width: '100%'
        }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          Profile
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Text style={[styles.editButtonText, { color: theme.primary }]}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Account Information
            </Text>

            {/* Display Name */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Display Name
              </Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundColor,
                      borderColor: theme.border,
                      color: theme.textColor,
                    },
                  ]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                  placeholderTextColor={theme.textSecondary}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: theme.textColor }]}>
                  {displayName || 'Not set'}
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Email
              </Text>
              <Text style={[styles.fieldValue, { color: theme.textColor }]}>
                {email}
              </Text>
              <Text style={[styles.fieldNote, { color: theme.textSecondary }]}>
                Email cannot be changed
              </Text>
            </View>

            {/* User ID */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                User ID
              </Text>
              <Text style={[styles.fieldValue, { color: theme.textSecondary, fontSize: 12 }]}>
                {user?.uid}
              </Text>
            </View>
          </View>

          {/* Account Actions */}
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Account Actions
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, { borderBottomColor: theme.border }]}
              onPress={() => setShowPasswordChange(true)}
            >
              <Text style={[styles.actionButtonText, { color: theme.textColor }]}>
                🔒 Change Password
              </Text>
              <Text style={[styles.actionButtonArrow, { color: theme.textSecondary }]}>
                →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => 
                Alert.alert(
                  'Delete Account',
                  'This action cannot be undone. All your data will be permanently deleted. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => {
                      setShowDeleteAccount(true)
                    }}
                  ]
                )
              }
            >
              <Text style={[styles.actionButtonText, { color: '#e53935' }]}>
                🗑️ Delete Account
              </Text>
              <Text style={[styles.actionButtonArrow, { color: theme.textSecondary }]}>
                →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: '#e53935' }]}>
              Delete Account
            </Text>
            <Text style={[styles.warningText, { color: theme.textSecondary }]}>
              Please enter your password to confirm account deletion. This action cannot be undone.
            </Text>
            
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.border,
                    color: theme.textColor,
                  },
                ]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.passwordChangeButtons}>
              <TouchableOpacity
                style={[styles.passwordButton, styles.cancelPasswordButton, { backgroundColor: theme.backgroundColor, borderColor: theme.border }]}
                onPress={cancelDeleteAccount}
              >
                <Text style={[styles.passwordButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.passwordButton, styles.deleteButton, { backgroundColor: '#e53935' }]}
                onPress={handleDeleteAccount}
              >
                <Text style={[styles.passwordButtonText, { color: 'white' }]}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Change Password
            </Text>
            
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Current Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.border,
                    color: theme.textColor,
                  },
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                New Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.border,
                    color: theme.textColor,
                  },
                ]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Confirm New Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.border,
                    color: theme.textColor,
                  },
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.passwordChangeButtons}>
              <TouchableOpacity
                style={[styles.passwordButton, styles.cancelPasswordButton, { backgroundColor: theme.backgroundColor, borderColor: theme.border }]}
                onPress={cancelPasswordChange}
              >
                <Text style={[styles.passwordButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.passwordButton, styles.savePasswordButton, { backgroundColor: theme.primary }]}
                onPress={handlePasswordChange}
              >
                <Text style={[styles.passwordButtonText, { color: 'white' }]}>
                  Update Password
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cancel Button (only show when editing) */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.cardBackground }]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  infoSection: {
    gap: 20,
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
  },
  fieldNote: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtonArrow: {
    fontSize: 16,
  },
  cancelButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  passwordChangeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  passwordButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelPasswordButton: {
    borderWidth: 1,
  },
  savePasswordButton: {
    // backgroundColor set dynamically
  },
  deleteButton: {
    // backgroundColor set dynamically
  },
  passwordButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
})