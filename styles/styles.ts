// MyFitApp/styles/styles.js
export default {
  // Container
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },

  // Login / Register
  loginTitle: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },
  loginForm: {},
  loginInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  loginButton: {
    height: 48,
    backgroundColor: '#3478f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  linkText: {
    color: '#3478f6',
  },

  // HomeScreen Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Button on left, title in center, placeholder on right
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 0, // Remove horizontal padding
    marginTop: 16,       // Move entire header down slightly
  },
  sidebarButton: {
    paddingVertical: 8,
    paddingHorizontal: 0, // Remove padding so button is at the very edge
    marginLeft: 0,
  },
  sidebarButtonText: {
    fontSize: 24,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileButtonText: {
    fontSize: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40, // Placeholder width of button + small padding
  },

  // Date Picker
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dateArrow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  dateArrowText: {
    fontSize: 24,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    minWidth: 100,
  },

  // Loading / Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 16,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  calories: {
    fontSize: 16,
    fontWeight: '500',
  },

  // FAB (AddButton)
  fabPosition: {
    position: 'absolute',
    right: 16,
  },

  // DatePickerModal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  yearArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  yearText: {
    fontSize: 16,
    marginHorizontal: 12,
  },
  currentYearText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  currentMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  daysContainer: {
    marginBottom: 20,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    width: 40,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  selectedDayCell: {
    backgroundColor: '#3478f6',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#3478f6',
  },
  dayText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayText: {
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // AddProductScreen
  addLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },

  // Swipeable Card
  swipeBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  swipeActionLeft: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  swipeActionRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}
