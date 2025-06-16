import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { auth, firestore } from "../firebase"

export type Entry = {
  id?: string
  name: string
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  dateTime: string
  calories: number
  userId: string
  isDeleted?: boolean
  deletedAt?: string
}

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password. Please try again.'
    case 'auth/user-not-found':
      return 'No account found with this email address. Please check your email or create an account.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.'
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.'
    case 'auth/requires-recent-login':
      return 'This operation requires recent authentication. Please sign in again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

export const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    console.log("Attempting to sign up user...")
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update the user's display name if provided
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      })
      console.log("Display name updated:", displayName)
    }
    
    console.log("User signed up successfully:", userCredential.user.uid)
    return userCredential.user
  } catch (error: any) {
    console.error("Sign up error:", error)
    const errorMessage = getAuthErrorMessage(error.code)
    throw new Error(errorMessage)
  }
}

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log("Attempting to sign in user...")
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("User signed in successfully:", userCredential.user.uid)
    return userCredential.user
  } catch (error: any) {
    console.error("Sign in error:", error)
    const errorMessage = getAuthErrorMessage(error.code)
    throw new Error(errorMessage)
  }
}

export const signOut = async (): Promise<void> => {
  try {
    console.log("Attempting to sign out user...")
    await firebaseSignOut(auth)
    console.log("User signed out successfully")
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

export const updateUserProfile = async (displayName: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not authenticated")
    }
    
    console.log("Updating user profile with display name:", displayName)
    await updateProfile(user, { displayName })
    console.log("User profile updated successfully")
  } catch (error: any) {
    console.error("Update profile error:", error)
    const errorMessage = getAuthErrorMessage(error.code) || error.message
    throw new Error(errorMessage)
  }
}

export const deleteUserAccount = async (password: string): Promise<void> => {
  try {
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error("User not authenticated")
    }
    
    console.log("Deleting user account...")
    
    // Reauthenticate user before deletion
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
    
    // Delete all user's entries from Firestore
    const q = query(
      collection(firestore, "entries"),
      where("userId", "==", user.uid)
    )
    const querySnapshot = await getDocs(q)
    const batch = writeBatch(firestore)
    
    querySnapshot.forEach((docSnap) => {
      batch.delete(doc(firestore, "entries", docSnap.id))
    })
    
    await batch.commit()
    console.log("User data deleted from Firestore")
    
    // Delete the user account
    await deleteUser(user)
    console.log("User account deleted successfully")
  } catch (error: any) {
    console.error("Delete account error:", error)
    const errorMessage = getAuthErrorMessage(error.code) || error.message
    throw new Error(errorMessage)
  }
}

export const addEntry = async (entry: Omit<Entry, "id" | "userId">): Promise<void> => {
  const user = auth.currentUser
  console.log("addEntry - Current user:", user ? "Authenticated" : "Not authenticated")
  if (!user) {
    console.log("addEntry - User not authenticated, auth.currentUser is null")
    throw new Error("User not authenticated")
  }

  const entryData = {
    ...entry,
    userId: user.uid,
    createdAt: Timestamp.now(),
  }

  await addDoc(collection(firestore, "entries"), entryData)
}

export const getUserEntries = async (): Promise<Entry[]> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Use only where clause to avoid needing a composite index
  const q = query(
    collection(firestore, "entries"),
    where("userId", "==", user.uid)
  )
  const querySnapshot = await getDocs(q)
  const entries: Entry[] = []

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as any
    entries.push({
      id: docSnap.id,
      name: data.name,
      mealType: data.mealType,
      dateTime: data.dateTime,
      calories: data.calories,
      userId: data.userId,
      isDeleted: data.isDeleted || false,
      deletedAt: data.deletedAt || null,
    })
  })

  // Sort locally by dateTime to avoid needing a composite index
  entries.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())

  return entries
}

export const getEntriesForDate = async (date: Date): Promise<Entry[]> => {
  const user = auth.currentUser
  console.log("getEntriesForDate - Current user:", user ? "Authenticated" : "Not authenticated")
  if (!user) {
    console.log("getEntriesForDate - User not authenticated, auth.currentUser is null")
    throw new Error("User not authenticated")
  }

  // Get all user entries and filter locally to avoid index requirement
  const q = query(
    collection(firestore, "entries"),
    where("userId", "==", user.uid)
  )

  const querySnapshot = await getDocs(q)
  const allEntries: Entry[] = []

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as any
    allEntries.push({
      id: docSnap.id,
      name: data.name,
      mealType: data.mealType,
      dateTime: data.dateTime,
      calories: data.calories,
      userId: data.userId,
      isDeleted: data.isDeleted || false,
      deletedAt: data.deletedAt || null,
    })
  })

  // Filter by date and exclude deleted entries locally
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const filteredEntries = allEntries.filter(entry => {
    const entryDate = new Date(entry.dateTime)
    const isInDateRange = entryDate >= startOfDay && entryDate <= endOfDay
    const isNotDeleted = !entry.isDeleted
    return isInDateRange && isNotDeleted
  })

  // Sort by time
  filteredEntries.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())

  return filteredEntries
}

export const updateEntry = async (entryId: string, updates: Partial<Omit<Entry, "id" | "userId">>): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  console.log('FirebaseService.updateEntry called with:', { entryId, updates })
  
  const entryRef = doc(firestore, "entries", entryId)
  await updateDoc(entryRef, updates)
  
  console.log('FirebaseService.updateEntry completed successfully')
}

export const deleteEntry = async (entryId: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const entryRef = doc(firestore, "entries", entryId)
  await updateDoc(entryRef, {
    isDeleted: true,
    deletedAt: new Date().toISOString()
  })
}

export const permanentlyDeleteEntry = async (entryId: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const entryRef = doc(firestore, "entries", entryId)
  await deleteDoc(entryRef)
}

export const restoreEntry = async (entryId: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const entryRef = doc(firestore, "entries", entryId)
  await updateDoc(entryRef, {
    isDeleted: false,
    deletedAt: null
  })
}

export const getDeletedEntries = async (): Promise<Entry[]> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Get all entries and filter locally to avoid index requirement
  const q = query(
    collection(firestore, "entries"),
    where("userId", "==", user.uid)
  )

  const querySnapshot = await getDocs(q)
  const entries: Entry[] = []

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as any
    // Only include deleted entries
    if (data.isDeleted === true) {
      entries.push({
        id: docSnap.id,
        name: data.name,
        mealType: data.mealType,
        dateTime: data.dateTime,
        calories: data.calories,
        userId: data.userId,
        isDeleted: data.isDeleted,
        deletedAt: data.deletedAt,
      })
    }
  })

  return entries
}

export const recalculateMealTypesForDate = async (date: Date): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const entriesForDate = await getEntriesForDate(date)
  
  if (entriesForDate.length === 0) {
    return
  }

  const sortedEntries = entriesForDate.sort((a, b) => 
    new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  )

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i]
    const entryTime = new Date(entry.dateTime)
    const hour = entryTime.getHours()
    
    let newMealType: string
    
    if (hour < 11) {
      newMealType = 'breakfast'
    } else if (hour < 15) {
      newMealType = 'lunch'
    } else if (hour < 18) {
      newMealType = 'snack'
    } else {
      newMealType = 'dinner'
    }

    if (entry.mealType !== newMealType && entry.id) {
      await updateEntry(entry.id, { mealType: newMealType as any })
    }
  }
}

