import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'

// 1. Go to https://console.firebase.google.com -> create a project
// 2. Project settings -> General -> "Your apps" -> Web app -> copy the config below
// 3. Paste your real values into .env.local (see .env.example) — do NOT hardcode here
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Lazily-resolved messaging instance (FCM doesn't work in every browser/context)
export const getMessagingIfSupported = async () => {
  const supported = await isSupported().catch(() => false)
  return supported ? getMessaging(app) : null
}

// --- App-wide constants -----------------------------------------------

// Whitelisted admin emails. Add the Google account(s) that should see the
// admin dashboard. Mirror this list in firestore.rules so it's enforced
// server-side too, not just hidden in the UI.
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export const SERVICE_CATEGORIES = [
  'Power Electrical',
  'CCTV',
  'Solar',
  'House Automation',
  'Building Construction',
  'Industrial Automation',
]

export const REQUEST_STATUS = {
  PENDING: 'pending',
  QUOTED: 'quoted',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
}
