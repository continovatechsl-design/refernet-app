import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getStorage } from 'firebase/storage'

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
export const storage = getStorage(app)
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

// Full job lifecycle:
// pending -> quoted (quotation PDF uploaded) -> accepted (customer said OK,
// confirmed by admin) -> invoiced (invoice PDF uploaded) -> paid (invoice
// paid, referrer points credited, payout countdown starts) -> completed
// (admin has paid the referrer out). "rejected" can happen from pending or
// quoted, if the customer never confirms.
export const REQUEST_STATUS = {
  PENDING: 'pending',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  INVOICED: 'invoiced',
  PAID: 'paid',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
}

// Referrer payouts are due this many days after the invoice is marked paid.
export const PAYOUT_DUE_DAYS = 7

// --- Points calculation (tiered, monthly) ------------------------------
// Points are auto-calculated from the invoice/quotation amount:
//  - Normal rate: 8% of the amount, converted to points at 1 point = LKR 1000.
//  - Once a referrer's total points earned *within the current calendar
//    month* crosses 100, the portion of amount that pushes them past 100
//    is calculated at a bonus 10% rate instead. It's a partial split, not
//    all-or-nothing — e.g. if they're at 95 points and a new invoice would
//    take them to 110, the first 5 points' worth of amount is at 8% and the
//    rest is at 10%.
export const POINT_VALUE_LKR = 1000
export const POINTS_NORMAL_RATE = 0.08
export const POINTS_BONUS_RATE = 0.10
export const POINTS_BONUS_THRESHOLD = 100
