/* eslint-disable no-undef */
// Background push handler. This file must live at the site root
// (/firebase-messaging-sw.js) — Vite copies anything in /public there as-is.
//
// Note: service workers can't read Vite's import.meta.env, so the config
// values are inlined here directly. Fill them in with the SAME values as
// your .env.local (these are public client identifiers, safe to expose).
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDvhyHhfsgxbipasHrUqvN5ZytLjzOKZFA',
  authDomain: 'planning-with-ai-81267.firebaseapp.com',
  projectId: 'planning-with-ai-81267',
  storageBucket: 'planning-with-ai-81267.firebasestorage.app',
  messagingSenderId: '325494044663',
  appId: '1:325494044663:web:6dcd1c25f28b015d7fa0f2',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || 'ReferNet', {
    body: body || '',
    icon: '/icon-192.png',
  })
})
