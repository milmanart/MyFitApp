// MyFitApp/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback, useContext } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Импортируем контекст авторизации и тему
import { AuthContext } from '../navigation/AuthContext'
import { useTheme } from '../navigation/ThemeContext'

// Импортируем кнопку добавления и сайдбар
import AddButton from '../components/AddButton'
import Sidebar from '../components/Sidebar'
import DatePickerModal from '../components/DatePickerModal'

// Импортируем стили
import styles from '../styles/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  AddProduct: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

type Entry = {
  name: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  dateTime: string
  calories: number
}

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useContext(AuthContext)
  const { theme } = useTheme()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [datePickerVisible, setDatePickerVisible] = useState(false)

  // Хелпер для проверки, соответствует ли дата выбранной дате
  const isSameDate = (iso: string, compareDate: Date) => {
    const d = new Date(iso)
    return (
      d.getFullYear() === compareDate.getFullYear() &&
      d.getMonth() === compareDate.getMonth() &&
      d.getDate() === compareDate.getDate()
    )
  }

  // Функция загрузки записей из AsyncStorage
  const fetchEntries = async () => {
    setLoading(true)
    try {
      const user = await AsyncStorage.getItem('currentUser')
      if (!user) {
        setEntries([])
        setLoading(false)
        return
      }
      const json = await AsyncStorage.getItem(`entries_${user}`)
      if (!json) {
        setEntries([])
        setLoading(false)
        return
      }
      const all: Entry[] = JSON.parse(json)
      const selectedDateList = all.filter((e) => isSameDate(e.dateTime, selectedDate))
      todayList.sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      )
      setEntries(selectedDateList)
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać wpisy')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  // При каждом фокусе экрана или изменении выбранной даты перезагружаем данные
  useFocusEffect(
    useCallback(() => {
      fetchEntries()
    }, [selectedDate])
  )

  // Функции для навигации по датам
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  // Форматирование выбранной даты
  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Рендер одной карточки
  const renderItem = ({ item }: { item: Entry }) => {
    const dt = new Date(item.dateTime)
    const timeString = dt.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const dateString = dt.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const mealLabel =
      item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)

    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.mealType, { color: theme.primary }]}>
          {mealLabel}
        </Text>
        <Text style={[styles.productName, { color: theme.textColor }]}>
          {item.name}
        </Text>
        <Text style={[styles.dateTime, { color: theme.textSecondary }]}>
          {`${dateString} o ${timeString}`}
        </Text>
        <Text style={[styles.calories, { color: '#e53935' }]}>
          {item.calories} kcal
        </Text>
      </View>
    )
  }

  const handleLogout = async () => {
    await signOut()
    navigation.replace('Login')
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundColor },
        ]}
      >
        <ActivityIndicator size="large" color="#0080ff" />
        <Text style={[styles.loadingText, { color: theme.textColor }]}>
          Ładowanie...
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.sidebarButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={[styles.sidebarButtonText, { color: theme.textColor }]}>
            ☰
          </Text>
        </TouchableOpacity>
        
        {/* DATE PICKER WITH ARROWS */}
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={goToPreviousDay}
          >
            <Text style={[styles.dateArrowText, { color: theme.textColor }]}>
              ‹
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
            <Text style={[styles.dateText, { color: theme.textColor }]}>
              {formatSelectedDate(selectedDate)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={goToNextDay}
          >
            <Text style={[styles.dateArrowText, { color: theme.textColor }]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerPlaceholder} />
      </View>

      {/* CONTENT */}
      <FlatList
        data={entries}
        keyExtractor={(item, idx) => item.dateTime + '-' + idx}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {/* FAB: кнопка “+” */}
      <AddButton
        onPress={() => navigation.navigate('AddProduct')}
        style={[styles.fabPosition, { bottom: 15 }]}
      />

      {/* SIDEBAR MODAL */}
      <Sidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
      />

      {/* DATE PICKER MODAL */}
      <DatePickerModal
        isVisible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectedDate(date)
          setDatePickerVisible(false)
        }}
      />
    </View>
  )
}
