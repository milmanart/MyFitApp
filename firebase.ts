// MyFitApp/firebase.ts

import { initializeApp } from "firebase/app"
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import AsyncStorage from '@react-native-async-storage/async-storage'

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBH8Fv3EBFrJHnjcB_ecb4AiUcU9mEJwf0",
  authDomain: "myfitapp-b714d.firebaseapp.com",
  projectId: "myfitapp-b714d",
  storageBucket: "myfitapp-b714d.appspot.com",
  messagingSenderId: "611291230572",
  appId: "1:611291230572:web:058fcc9ca0dda4ecf34349",
  measurementId: "G-7REQ1FR3GC"
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig)

// Initialize Auth with React Native persistence
let auth
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  })
  console.log("Firebase Auth initialized with React Native persistence")
} catch (error) {
  // If auth is already initialized, get existing instance
  auth = getAuth(app)
  console.log("Using existing Firebase Auth instance")
}

// Initialize Firestore
const firestore = getFirestore(app)

console.log("Firebase initialized successfully")

export { auth, firestore }
export default app
