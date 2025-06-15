import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '../navigation/ThemeContext'

interface TimePickerModalProps {
  isVisible: boolean
  onClose: () => void
  selectedTime: { hour: number; minute: number }
  onTimeSelect: (time: { hour: number; minute: number }) => void
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function TimePickerModal({
  isVisible,
  onClose,
  selectedTime,
  onTimeSelect,
}: TimePickerModalProps) {
  const { theme } = useTheme()
  const [tempTime, setTempTime] = useState(() => {
    const date = new Date()
    date.setHours(selectedTime.hour, selectedTime.minute, 0, 0)
    return date
  })
  const [showNativePicker, setShowNativePicker] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const date = new Date()
      date.setHours(selectedTime.hour, selectedTime.minute, 0, 0)
      setTempTime(date)
      
      if (Platform.OS === 'android') {
        // On Android, show the native picker immediately
        setShowNativePicker(true)
      }
    } else {
      setShowNativePicker(false)
    }
  }, [isVisible, selectedTime])

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowNativePicker(false)
      if (event.type === 'dismissed') {
        onClose()
        return
      }
    }
    
    if (selectedDate) {
      setTempTime(selectedDate)
      if (Platform.OS === 'android') {
        // On Android, apply changes immediately
        onTimeSelect({
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes()
        })
        onClose()
      }
    }
  }

  const handleConfirm = () => {
    onTimeSelect({
      hour: tempTime.getHours(),
      minute: tempTime.getMinutes()
    })
    onClose()
  }

  // For iOS, show custom interface with native picker
  if (Platform.OS === 'ios') {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.textColor }]}>
                Select Time
              </Text>
            </View>

            {/* iOS Time Picker */}
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              style={styles.iosTimePicker}
              textColor={theme.textColor}
            />

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <Text style={[styles.buttonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                <Text style={[styles.buttonText, { color: theme.primary }]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }

  // For Android, use native Material Design picker
  if (Platform.OS === 'android' && showNativePicker) {
    return (
      <DateTimePicker
        value={tempTime}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={handleTimeChange}
      />
    )
  }

  // Fallback for other platforms or when picker is hidden
  return null
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  iosTimePicker: {
    height: 200,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})