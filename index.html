import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { auth, db, googleProvider, ADMIN_EMAILS } from '../firebase'
import { generateReferralCode, popReferralCode } from '../utils/referral'

const AuthContext = createContext(null)

// Reserves a referral code atomically via referralCodes/{code} -> { uid }.
// Retries with a fresh code on the rare collision.
async function reserveReferralCode(uid) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode()
    const codeRef = doc(db, 'referralCodes', code)
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(codeRef)
        if (snap.exists()) throw new Error('collision')
        tx.set(codeRef, { uid, createdAt: serverTimestamp() })
      })
      return code
    } catch (e) {
      continue
    }
  }
  throw new Error('Could not generate a unique referral code, try again.')
}

async function resolveReferrerUid(referredByCode) {
  if (!referredByCode) return null
  const snap = await getDoc(doc(db, 'referralCodes', referredByCode))
  return snap.exists() ? snap.data().uid : null
}

async function ensureUserProfile(fbUser) {
  const userRef = doc(db, 'users', fbUser.uid)
  const existing = await getDoc(userRef)
  if (existing.exists()) return existing.data()

  const referredByCode = popReferralCode()
  const [referralCode, referredByUid] = await Promise.all([
    reserveReferralCode(fbUser.uid),
    resolveReferrerUid(referredByCode && referredByCode !== fbUser.uid ? referredByCode : null),
  ])

  const profile = {
    uid: fbUser.uid,
    name: fbUser.displayName || 'Unnamed',
    email: fbUser.email,
    photoURL: fbUser.photoURL || null,
    referralCode,
    referredByCode: referredByUid ? referredByCode : null,
    referredByUid: referredByUid || null,
    points: 0,
    fcmToken: null,
    createdAt: serverTimestamp(),
  }
  await setDoc(userRef, profile)
  return profile
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let unsubProfile = () => {}
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      unsubProfile()
      setError(null)
      if (!fbUser) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      setUser(fbUser)
      try {
        await ensureUserProfile(fbUser)
        unsubProfile = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
          setProfile(snap.data())
          setLoading(false)
        })
      } catch (e) {
        console.error(e)
        setError(e.message)
        setLoading(false)
      }
    })
    return () => {
      unsubAuth()
      unsubProfile()
    }
  }, [])

  const signInWithGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setError(e.message)
    }
  }

  const signOutUser = () => signOut(auth)

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, error, isAdmin, signInWithGoogle, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
