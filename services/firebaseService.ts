// MyFitApp/services/firebaseService.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
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
import { assignMealTypes } from "../utils/mealTypeUtils"

export type Entry = {
  id?: string
  name: string
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  dateTime: string
  calories: number
  userId: string
}

// ----------------------
// Auth: signUp, signIn, signOut
// ----------------------

export const signUp = async (email: string, password: string): Promise<User> => {
  try {
    console.log("Attempting to sign up user...")
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log("User signed up successfully:", userCredential.user.uid)
    return userCredential.user
  } catch (error) {
    console.error("Sign up error:", error)
    throw error
  }
}

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log("Attempting to sign in user...")
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("User signed in successfully:", userCredential.user.uid)
    return userCredential.user
  } catch (error) {
    console.error("Sign in error:", error)
    throw error
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

// ----------------------
// Firestore: addEntry, getUserEntries, getEntriesForDate
// ----------------------

/**
 * Adds one entry (Entry) to the "entries" collection.
 * Document fields: name, mealType, dateTime, calories, userId, createdAt.
 */
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

/**
 * Returns all entries (Entry) for the current user, ordered by dateTime.
 */
export const getUserEntries = async (): Promise<Entry[]> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const q = query(
    collection(firestore, "entries"),
    where("userId", "==", user.uid),
    orderBy("dateTime", "asc")
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
    })
  })

  return entries
}

/**
 * Returns all entries (Entry) for the current user for a specific date.
 * Comparison is done using ISO dateTime strings between startOfDay and endOfDay.
 */
export const getEntriesForDate = async (date: Date): Promise<Entry[]> => {
  const user = auth.currentUser
  console.log("getEntriesForDate - Current user:", user ? "Authenticated" : "Not authenticated")
  if (!user) {
    console.log("getEntriesForDate - User not authenticated, auth.currentUser is null")
    throw new Error("User not authenticated")
  }

  // Temporarily get all user entries and filter locally
  // After creating index, can return complex query
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
    })
  })

  // Filter by date locally
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const filteredEntries = allEntries.filter(entry => {
    const entryDate = new Date(entry.dateTime)
    return entryDate >= startOfDay && entryDate <= endOfDay
  })

  // Sort by time
  filteredEntries.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())

  return filteredEntries
}

/**
 * Updates an existing entry in Firestore
 */
export const updateEntry = async (entryId: string, updates: Partial<Omit<Entry, "id" | "userId">>): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const entryRef = doc(firestore, "entries", entryId)
  await updateDoc(entryRef, updates)
}

/**
 * Deletes an entry from Firestore
 */
export const deleteEntry = async (entryId: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  const entryRef = doc(firestore, "entries", entryId)
  await deleteDoc(entryRef)
}

/**
 * Recalculates and updates meal types for all entries on a specific date
 */
export const recalculateMealTypesForDate = async (date: Date): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }

  // Get all entries for the date
  const entries = await getEntriesForDate(date)
  
  if (entries.length === 0) return

  // Assign new meal types
  const updatedEntries = assignMealTypes(entries)

  // Batch update all entries
  const batch = writeBatch(firestore)
  
  updatedEntries.forEach((entry) => {
    if (entry.id) {
      const entryRef = doc(firestore, "entries", entry.id)
      batch.update(entryRef, { mealType: entry.mealType })
    }
  })

  await batch.commit()
}
