// Server-side push notifications. Requires the Firebase Blaze (pay-as-you-go)
// plan — Cloud Functions don't run on the free Spark plan. Deploy with:
//   cd functions && npm install && npm run deploy
//
// This is what actually SENDS the FCM push. The client (src/utils/notifications.js)
// only requests permission and stores the device token — a browser can't
// push-notify another browser directly, it has to go through a server.

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'

initializeApp()
const db = getFirestore()
const messaging = getMessaging()

// Keep this in sync with src/firebase.js ADMIN_EMAILS / firestore.rules.
const ADMIN_EMAILS = ['continovatech.sl@gmail.com']

async function sendToUid(uid, notification) {
  if (!uid) return
  const snap = await db.doc(`users/${uid}`).get()
  const token = snap.data()?.fcmToken
  if (!token) return
  try {
    await messaging.send({ token, notification })
  } catch (e) {
    console.error(`Failed to notify ${uid}:`, e.message)
  }
}

async function sendToAdmins(notification) {
  const usersSnap = await db.collection('users').where('email', 'in', ADMIN_EMAILS.slice(0, 10)).get()
  await Promise.all(
    usersSnap.docs.map((d) => {
      const token = d.data().fcmToken
      return token ? messaging.send({ token, notification }).catch((e) => console.error(e.message)) : null
    })
  )
}

// New request submitted -> notify admins
export const notifyAdminOnNewRequest = onDocumentCreated('requests/{requestId}', async (event) => {
  const r = event.data.data()
  await sendToAdmins({
    title: 'New referral request',
    body: `${r.customerName} · ${r.category} — from ${r.submittedByName}`,
  })
})

// Request quoted or completed -> notify the referrer who gets credit
export const notifyReferrerOnStatusChange = onDocumentUpdated('requests/{requestId}', async (event) => {
  const before = event.data.before.data()
  const after = event.data.after.data()
  if (before.status === after.status) return

  if (after.status === 'quoted') {
    await sendToUid(after.referrerUid, {
      title: 'Quotation sent',
      body: `A quotation was sent for ${after.customerName}'s ${after.category} job.`,
    })
  }
  if (after.status === 'completed') {
    await sendToUid(after.referrerUid, {
      title: 'Job completed 🎉',
      body: `${after.customerName}'s job is complete — you earned ${after.pointsAwarded} points.`,
    })
  }
})
