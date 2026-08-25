<script setup lang="ts">
import type { WellbeingScaleValue } from '~/shared/types/wellbeing'

definePageMeta({ layout: 'default' })

const { checkIns, pending, error, fetchCheckIns, saveCheckIn, todayCheckIn, weeklyAverages, today } = useWellbeing()
await fetchCheckIns()

const { locale } = useI18n()

const mood = ref<WellbeingScaleValue>(todayCheckIn.value?.mood ?? 3)
const energy = ref<WellbeingScaleValue>(todayCheckIn.value?.energy ?? 3)
const stress = ref<WellbeingScaleValue>(todayCheckIn.value?.stress ?? 3)
const note = ref(todayCheckIn.value?.note ?? '')
const saving = ref(false)
const saved = ref(false)

async function submit() {
  saving.value = true
  saved.value = false
  try {
    await saveCheckIn({ date: today, mood: mood.value, energy: energy.value, stress: stress.value, note: note.value })
    saved.value = true
  } finally {
    saving.value = false
  }
}

// Simple box-breathing guide (4s in, 4s hold, 4s out, 4s hold) — a real,
// self-paced exercise, not a decorative animation. No audio/haptics assumed.
const breathingActive = ref(false)
const breathingPhase = ref<'in' | 'hold1' | 'out' | 'hold2'>('in')
let breathingTimer: ReturnType<typeof setInterval> | null = null
const PHASES: Array<typeof breathingPhase.value> = ['in', 'hold1', 'out', 'hold2']

function toggleBreathing() {
  if (breathingActive.value) {
    stopBreathing()
    return
  }
  breathingActive.value = true
  let i = 0
  breathingPhase.value = PHASES[0]
  breathingTimer = setInterval(() => {
    i = (i + 1) % PHASES.length
    breathingPhase.value = PHASES[i]
  }, 4000)
}

function stopBreathing() {
  breathingActive.value = false
  if (breathingTimer) clearInterval(breathingTimer)
  breathingTimer = null
}

onUnmounted(() => {
  if (breathingTimer) clearInterval(breathingTimer)
})

const scaleValues: WellbeingScaleValue[] = [1, 2, 3, 4, 5]

function fmt(n: number) {
  return n.toFixed(1)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('wellbeing.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('wellbeing.subtitle') }}</p>
      </div>
      <NuxtLink
        to="/wellbeing/chat"
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2 shrink-0"
      >
        <UiIcon name="message-circle" :size="16" class="text-primary" />
        {{ $t('wellbeing.chat.title') }}
      </NuxtLink>
    </div>

    <div class="rounded-lg border border-primary/20 bg-primary/5 p-4 text-body-sm text-ink-500 dark:text-ink-300">
      {{ $t('wellbeing.disclaimer') }}
    </div>

    <div v-if="pending" class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">{{ $t(error) }}</div>

    <template v-else>
      <!-- Weekly averages -->
      <div v-if="weeklyAverages" class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5">
        <p class="text-body-sm font-medium mb-4">{{ $t('wellbeing.weekly.title', { count: weeklyAverages.count }) }}</p>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="text-h2 font-semibold">{{ fmt(weeklyAverages.mood) }}</p>
            <p class="text-caption text-ink-400">{{ $t('wellbeing.mood') }}</p>
          </div>
          <div>
            <p class="text-h2 font-semibold">{{ fmt(weeklyAverages.energy) }}</p>
            <p class="text-caption text-ink-400">{{ $t('wellbeing.energy') }}</p>
          </div>
          <div>
            <p class="text-h2 font-semibold">{{ fmt(weeklyAverages.stress) }}</p>
            <p class="text-caption text-ink-400">{{ $t('wellbeing.stress') }}</p>
          </div>
        </div>
      </div>

      <!-- Today's check-in -->
      <div class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5 space-y-5">
        <p class="text-body-sm font-medium">
          {{ todayCheckIn ? $t('wellbeing.checkin.updateTitle') : $t('wellbeing.checkin.title') }}
        </p>

        <div v-for="dim in (['mood', 'energy', 'stress'] as const)" :key="dim">
          <p class="text-body-sm text-ink-400 mb-2">{{ $t(`wellbeing.${dim}`) }}</p>
          <div class="flex gap-2">
            <button
              v-for="v in scaleValues"
              :key="v"
              type="button"
              class="size-10 rounded-md border text-body-sm font-medium transition-colors"
              :class="
                (dim === 'mood' ? mood : dim === 'energy' ? energy : stress) === v
                  ? 'bg-primary text-ink-950 border-primary'
                  : 'border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5'
              "
              :aria-pressed="(dim === 'mood' ? mood : dim === 'energy' ? energy : stress) === v"
              :aria-label="`${$t(`wellbeing.${dim}`)} ${v}`"
              @click="dim === 'mood' ? (mood = v) : dim === 'energy' ? (energy = v) : (stress = v)"
            >
              {{ v }}
            </button>
          </div>
        </div>

        <div>
          <label class="text-body-sm text-ink-400 mb-2 block" for="wellbeing-note">{{ $t('wellbeing.note') }}</label>
          <textarea
            id="wellbeing-note"
            v-model="note"
            rows="3"
            class="w-full rounded-md border border-ink-100 dark:border-white/10 bg-transparent px-3 py-2 text-body-sm"
            :placeholder="$t('wellbeing.notePlaceholder')"
          />
        </div>

        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors disabled:opacity-50"
            :disabled="saving"
            @click="submit"
          >
            {{ saving ? $t('wellbeing.saving') : $t('wellbeing.save') }}
          </button>
          <span v-if="saved" class="text-body-sm text-success">{{ $t('wellbeing.saved') }}</span>
        </div>
      </div>

      <!-- Breathing exercise -->
      <div class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5">
        <div class="flex items-center gap-2 mb-4">
          <UiIcon name="wind" :size="18" class="text-primary" />
          <p class="text-body-sm font-medium">{{ $t('wellbeing.breathing.title') }}</p>
        </div>
        <div class="flex flex-col items-center gap-4 py-4">
          <div
            class="rounded-full bg-primary/20 border-2 border-primary transition-all duration-[4000ms] ease-in-out flex items-center justify-center text-body-sm font-medium"
            :class="breathingActive && (breathingPhase === 'in' || breathingPhase === 'hold1') ? 'size-32' : 'size-16'"
          >
            <span v-if="breathingActive">{{ $t(`wellbeing.breathing.${breathingPhase}`) }}</span>
          </div>
          <button
            class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 transition-colors"
            @click="toggleBreathing"
          >
            {{ breathingActive ? $t('wellbeing.breathing.stop') : $t('wellbeing.breathing.start') }}
          </button>
        </div>
      </div>

      <!-- Recent check-ins -->
      <div v-if="checkIns.length" class="space-y-2">
        <p class="text-body-sm font-medium">{{ $t('wellbeing.history') }}</p>
        <div v-for="c in checkIns.slice(0, 14)" :key="c.id" class="flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-3">
          <p class="text-body-sm text-ink-400 w-28 shrink-0">{{ new Date(c.date).toLocaleDateString(locale) }}</p>
          <p class="text-body-sm flex-1">
            {{ $t('wellbeing.mood') }} {{ c.mood }} · {{ $t('wellbeing.energy') }} {{ c.energy }} · {{ $t('wellbeing.stress') }} {{ c.stress }}
          </p>
          <p v-if="c.note" class="text-caption text-ink-400 truncate max-w-xs">{{ c.note }}</p>
        </div>
      </div>
    </template>
  </div>
</template>
