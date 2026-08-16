import type { WellbeingCheckIn, WellbeingCheckInInput } from '~/shared/types/wellbeing'

export function useWellbeing() {
  const checkIns = useState<WellbeingCheckIn[]>('wellbeing-checkins', () => [])
  const pending = useState('wellbeing-pending', () => false)
  const error = useState<string | null>('wellbeing-error', () => null)

  async function fetchCheckIns() {
    pending.value = true
    error.value = null
    try {
      checkIns.value = await $fetch<WellbeingCheckIn[]>('/api/wellbeing')
    } catch {
      error.value = 'wellbeing.errors.load'
    } finally {
      pending.value = false
    }
  }

  // Upserts — one check-in per day. The server replaces today's entry if one
  // already exists for the caller, so this is safe to call repeatedly.
  async function saveCheckIn(input: WellbeingCheckInInput) {
    const saved = await $fetch<WellbeingCheckIn>('/api/wellbeing', { method: 'POST', body: input })
    const others = checkIns.value.filter((c) => c.date !== saved.date)
    checkIns.value = [saved, ...others].sort((a, b) => (a.date < b.date ? 1 : -1))
    return saved
  }

  async function removeCheckIn(id: string) {
    await $fetch(`/api/wellbeing/${id}`, { method: 'DELETE' })
    checkIns.value = checkIns.value.filter((c) => c.id !== id)
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayCheckIn = computed(() => checkIns.value.find((c) => c.date === today) ?? null)

  // Last 7 entries (not necessarily consecutive calendar days), averaged —
  // a simple trend signal, not a clinical score.
  const weeklyAverages = computed(() => {
    const recent = checkIns.value.slice(0, 7)
    if (recent.length === 0) return null
    const avg = (key: 'mood' | 'energy' | 'stress') => recent.reduce((sum, c) => sum + c[key], 0) / recent.length
    return { mood: avg('mood'), energy: avg('energy'), stress: avg('stress'), count: recent.length }
  })

  return { checkIns, pending, error, fetchCheckIns, saveCheckIn, removeCheckIn, todayCheckIn, weeklyAverages, today }
}
