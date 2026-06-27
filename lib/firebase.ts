import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// The app stays fully functional with local seed data when Firebase is not
// configured. Once these env vars are set, reports sync live across all users.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

let app: FirebaseApp | null = null
let firestore: Firestore | null = null

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  firestore = getFirestore(app)
}

export const db = firestore
