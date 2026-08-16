import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let app: App
let db: Firestore

/**
 * In dev (FIRESTORE_EMULATOR_HOST set) the Admin SDK talks to the local
 * Firestore emulator and any project id / credentials are accepted.
 * In production, real service-account credentials are required via env.
 */
export function getDb(): Firestore {
  if (db) return db

  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'vora-dev'

    if (process.env.FIRESTORE_EMULATOR_HOST) {
      app = initializeApp({ projectId })
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Path to a downloaded service-account JSON (see .secrets/, gitignored).
      app = initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) })
    } else {
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

      if (!clientEmail || !privateKey) {
        throw new Error(
          'Firebase credentials missing. Set FIRESTORE_EMULATOR_HOST for local dev, GOOGLE_APPLICATION_CREDENTIALS for a service-account file, or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY for production.',
        )
      }

      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    }
  }

  db = getFirestore(app)
  return db
}
