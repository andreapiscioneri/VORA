import { DEFAULT_DASHBOARD_LAYOUT, type DashboardLayout } from '~/shared/types/dashboard'
import { getDb } from './firebase'

const COLLECTION = 'dashboardLayouts'

// One document per user, keyed by userId as the document ID directly (no
// separate lookup needed, and it makes "does this user have a layout yet"
// a single get-by-id instead of a query) — same trick as notificationPreferences.
export async function getLayout(userId: string): Promise<DashboardLayout> {
  const doc = await getDb().collection(COLLECTION).doc(userId).get()
  if (!doc.exists) return DEFAULT_DASHBOARD_LAYOUT
  const data = doc.data() as DashboardLayout | undefined
  if (!data?.widgets?.length) return DEFAULT_DASHBOARD_LAYOUT
  return data
}

export async function setLayout(userId: string, layout: DashboardLayout): Promise<DashboardLayout> {
  await getDb().collection(COLLECTION).doc(userId).set(layout)
  return layout
}
