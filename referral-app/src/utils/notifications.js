import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { db, getMessagingIfSupported } from '../firebase'

// Call after login (e.g. a "Enable notifications" button) to request
// permission and store the device's FCM token on the user's profile.
export async function enablePushNotifications(uid) {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return { ok: false, reason: 'unsupported' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: 'denied' }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    ),
  })

  if (token) {
    await updateDoc(doc(db, 'users', uid), { fcmToken: token })
    return { ok: true, token }
  }
  return { ok: false, reason: 'no-token' }
}

// Foreground message listener (background messages are handled by the
// service worker in public/firebase-messaging-sw.js)
export async function listenForForegroundMessages(callback) {
  const messaging = await getMessagingIfSupported()
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}
