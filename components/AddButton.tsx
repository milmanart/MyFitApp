// MyFitApp/components/AddButton.tsx
import React from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface AddButtonProps {
  onPress: () => void
  style?: ViewStyle
}

export default function AddButton({ onPress, style }: AddButtonProps) {
  return (
    <TouchableOpacity style={[styles.fab, style]} onPress={onPress}>
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3478f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // тень для Android
    shadowColor: '#000', // тень для iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
})
