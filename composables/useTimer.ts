import { useStorage, useIntervalFn } from '@vueuse/core'

export function useTimer() {
  const startedAt = useStorage<string | null>('vora-timer-started-at', null)
  const projectId = useStorage<string | null>('vora-timer-project-id', null)
  const description = useStorage('vora-timer-description', '')
  const now = ref(Date.now())

  const { pause, resume } = useIntervalFn(() => {
    now.value = Date.now()
  }, 1000)

  const isRunning = computed(() => !!startedAt.value)

  const elapsedMinutes = computed(() => {
    if (!startedAt.value) return 0
    return Math.max(0, Math.floor((now.value - new Date(startedAt.value).getTime()) / 60000))
  })

  const elapsedLabel = computed(() => {
    if (!startedAt.value) return '00:00:00'
    const totalSeconds = Math.max(0, Math.floor((now.value - new Date(startedAt.value).getTime()) / 1000))
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  })

  function start(pId: string | null, desc: string) {
    startedAt.value = new Date().toISOString()
    projectId.value = pId
    description.value = desc
    now.value = Date.now()
    resume()
  }

  function stop() {
    const start = startedAt.value
    const pId = projectId.value
    const desc = description.value
    startedAt.value = null
    projectId.value = null
    description.value = ''
    pause()
    return start ? { startedAt: start, projectId: pId, description: desc } : null
  }

  return { isRunning, elapsedMinutes, elapsedLabel, projectId, description, start, stop }
}
