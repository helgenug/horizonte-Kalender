import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { db } from './firebase.js'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const VAPID_KEY = 'BEHowiQDTWW6gg8LpN2CMy_-Zw6cpRXIRxM_HOuyQiPCr1LCjskpTf67WCL2BJCb4Kkv0TogaXysQeqnukt5tLM'

export async function requestPushPermission(personKey) {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const msg = getMessaging()
    const token = await getToken(msg, { vapidKey: VAPID_KEY })
    if (!token) return false

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
