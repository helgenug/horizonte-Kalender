import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { db } from './firebase.js'
import { doc, setDoc, getDoc } from 'firebase/firestore'

// Replace with your VAPID key from Firebase Console → Project Settings → Cloud Messaging
const VAPID_KEY = 'REPLACE_WITH_YOUR_VAPID_KEY'

let messaging = null

function getMsg() {
  if (!messaging) {
    const { initializeApp, getApps } = require('firebase/app')
    messaging = getMessaging()
  }
  return messaging
}

export async function requestPushPermission(personKey) {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const msg = getMessaging()
    const token = await getToken(msg, { vapidKey: VAPID_KEY })
    if (!token) return false

    // Save token to Firestore under _meta/pushTokens
    const ref = doc(db, '_meta', 'pushTokens')
    const snap = await getDoc(ref)
    const existing = snap.exists() ? snap.data() : {}
    await setDoc(ref, { ...existing, [personKey]: token })
    return true
  } catch (err) {
    console.error('Push permission error:', err)
    return false
  }
}

export function listenForForegroundMessages(onReceive) {
  try {
    const msg = getMessaging()
    return onMessage(msg, payload => {
      onReceive(payload)
    })
  } catch {
    return () => {}
  }
}
