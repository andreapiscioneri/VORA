import type { TrainingCourse, TrainingCourseInput } from '~/shared/types/training'
import type { PageResult } from '~/server/utils/pagination'

export function useTraining() {
  const courses = useState<TrainingCourse[]>('training-courses', () => [])
  const pending = useState('training-pending', () => false)
  const loadingMore = useState('training-loading-more', () => false)
  const error = useState<string | null>('training-error', () => null)
  const nextCursor = useState<string | null>('training-cursor', () => null)
  const hasMore = useState('training-has-more', () => false)

  async function fetchCourses() {
    pending.value = true
    error.value = null
    try {
      const page = await $fetch<PageResult<TrainingCourse>>('/api/training')
      courses.value = page.items
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } catch {
      error.value = 'training.errors.load'
    } finally {
      pending.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const page = await $fetch<PageResult<TrainingCourse>>('/api/training', { query: { cursor: nextCursor.value } })
      courses.value = [...courses.value, ...page.items]
      nextCursor.value = page.nextCursor
      hasMore.value = page.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function createCourse(input: TrainingCourseInput) {
    const created = await $fetch<TrainingCourse>('/api/training', { method: 'POST', body: input })
    courses.value = [created, ...courses.value]
    return created
  }

  async function updateCourse(id: string, input: TrainingCourseInput) {
    const updated = await $fetch<TrainingCourse>(`/api/training/${id}`, { method: 'PUT', body: input })
    courses.value = courses.value.map((c) => (c.id === id ? updated : c))
    return updated
  }

  async function removeCourse(id: string) {
    await $fetch(`/api/training/${id}`, { method: 'DELETE' })
    courses.value = courses.value.filter((c) => c.id !== id)
  }

  return { courses, pending, error, hasMore, loadingMore, fetchCourses, loadMore, createCourse, updateCourse, removeCourse }
}
