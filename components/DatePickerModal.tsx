import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { useTheme } from '../navigation/ThemeContext'
import styles from '../styles/styles'

interface DatePickerModalProps {
  isVisible: boolean
  onClose: () => void
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function DatePickerModal({
  isVisible,
  onClose,
  selectedDate,
  onDateSelect,
}: DatePickerModalProps) {
  const { theme } = useTheme()
  const [viewDate, setViewDate] = useState(new Date(selectedDate))

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  const goToPreviousYear = () => {
    const newDate = new Date(viewDate)
    newDate.setFullYear(currentYear - 1)
    setViewDate(newDate)
  }

  const goToNextYear = () => {
    const newDate = new Date(viewDate)
    newDate.setFullYear(currentYear + 1)
    setViewDate(newDate)
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(currentMonth - 1)
    setViewDate(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(currentMonth + 1)
    setViewDate(newDate)
  }

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)
    onDateSelect(newDate)
    onClose()
  }

  const isSelectedDay = (day: number) => {
    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === day
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    )
  }

  const days = getDaysInMonth(currentYear, currentMonth)

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.datePickerModal, { backgroundColor: theme.backgroundColor }]}>
          {/* Year selector */}
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={goToPreviousYear}>
              <Text style={[styles.yearArrow, { color: theme.textColor }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.yearContainer}>
              <Text style={[styles.yearText, { color: theme.textSecondary }]}>
                {currentYear - 1}
              </Text>
              <Text style={[styles.currentYearText, { color: theme.textColor }]}>
                {currentYear}
              </Text>
              <Text style={[styles.yearText, { color: theme.textSecondary }]}>
                {currentYear + 1}
              </Text>
            </View>
            <TouchableOpacity onPress={goToNextYear}>
              <Text style={[styles.yearArrow, { color: theme.textColor }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Month selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={goToPreviousMonth}>
              <Text style={[styles.monthArrow, { color: theme.textColor }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.monthContainer}>
              <Text style={[styles.monthText, { color: theme.textSecondary }]}>
                {monthNames[currentMonth === 0 ? 11 : currentMonth - 1]}
              </Text>
              <Text style={[styles.currentMonthText, { color: theme.textColor }]}>
                {monthNames[currentMonth]}
              </Text>
              <Text style={[styles.monthText, { color: theme.textSecondary }]}>
                {monthNames[currentMonth === 11 ? 0 : currentMonth + 1]}
              </Text>
            </View>
            <TouchableOpacity onPress={goToNextMonth}>
              <Text style={[styles.monthArrow, { color: theme.textColor }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Days grid */}
          <View style={styles.daysContainer}>
            {/* Week days header */}
            <View style={styles.weekDaysHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={[styles.weekDayText, { color: theme.textSecondary }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.daysGrid}>
              {days.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    day && isSelectedDay(day) && styles.selectedDayCell,
                    day && isToday(day) && styles.todayCell,
                  ]}
                  onPress={() => day && handleDateSelect(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text
                      style={[
                        styles.dayText,
                        { color: theme.textColor },
                        isSelectedDay(day) && styles.selectedDayText,
                        isToday(day) && styles.todayText,
                      ]}
                    >
                      {day}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}