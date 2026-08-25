import { DEFAULT_DASHBOARD_LAYOUT, type DashboardLayout } from '~/shared/types/dashboard'

export function useDashboardLayout() {
  const layout = useState<DashboardLayout>('dashboard-layout', () => DEFAULT_DASHBOARD_LAYOUT)
  const pending = useState('dashboard-layout-pending', () => false)
  const error = useState<string | null>('dashboard-layout-error', () => null)

  async function fetchLayout() {
    pending.value = true
    error.value = null
    try {
      layout.value = await $fetch<DashboardLayout>('/api/dashboard/layout')
    } catch {
      error.value = 'dashboard.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function updateLayout(input: DashboardLayout) {
    const updated = await $fetch<DashboardLayout>('/api/dashboard/layout', { method: 'PUT', body: input })
    layout.value = updated
    return updated
  }

  return { layout, pending, error, fetchLayout, updateLayout }
}
