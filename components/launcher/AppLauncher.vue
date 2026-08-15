<script setup lang="ts">
import { launcherApps } from '~/composables/useNav'
import type { SearchResultType } from '~/shared/types/search'

const launcherOpen = useState('launcher-open', () => false)
const assistantOpen = useState('assistant-open', () => false)
const { query, results, loading, reset } = useGlobalSearch()
const router = useRouter()
const colorMode = useColorMode()
const { locale, locales, setLocale, t } = useI18n()
const inputRef = ref<HTMLInputElement | null>(null)

const TYPE_ICONS: Record<SearchResultType, string> = {
  contact: 'users',
  task: 'check-square',
  appointment: 'clock',
  ticket: 'life-buoy',
  project: 'folder',
  communication: 'mail',
  knowledge: 'book-open',
}

function close() {
  launcherOpen.value = false
  reset()
}

function go(to: string) {
  router.push(to)
  close()
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  close()
}

function cycleLanguage() {
  const codes = locales.value.map((l) => (typeof l === 'string' ? l : l.code))
  const next = codes[(codes.indexOf(locale.value) + 1) % codes.length]
  setLocale(next)
  close()
}

function openAssistant() {
  assistantOpen.value = true
  close()
}

// Each "New X" command navigates to the module's list page with
// ?action=new, which that page reads on mount to auto-open its create
// form — a real action, not just a shortcut to the page.
interface Command { id: string; label: string; icon: string; run: () => void }

const commands = computed<Command[]>(() => [
  { id: 'new-contact', label: t('launcher.commands.newContact'), icon: 'user-plus', run: () => go('/contacts?action=new') },
  { id: 'new-task', label: t('launcher.commands.newTask'), icon: 'check-square', run: () => go('/tasks?action=new') },
  { id: 'new-appointment', label: t('launcher.commands.newAppointment'), icon: 'clock', run: () => go('/appointments?action=new') },
  { id: 'open-calendar', label: t('launcher.commands.openCalendar'), icon: 'calendar', run: () => go('/calendar') },
  { id: 'open-crm', label: t('launcher.commands.openCrm'), icon: 'trending-up', run: () => go('/crm') },
  { id: 'ask-ai', label: t('launcher.commands.askAI'), icon: 'sparkles', run: openAssistant },
  { id: 'change-theme', label: t('launcher.commands.changeTheme'), icon: 'sun', run: toggleTheme },
  { id: 'change-language', label: t('launcher.commands.changeLanguage'), icon: 'globe', run: cycleLanguage },
])

const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return commands.value
  return commands.value.filter((c) => c.label.toLowerCase().includes(q))
})

watch(launcherOpen, async (open) => {
  if (open) {
    await nextTick()
    inputRef.value?.focus()
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
  if (e.key !== 'Enter') return
  if (query.value.trim() && filteredCommands.value.length) filteredCommands.value[0].run()
  else if (results.value.length) go(results.value[0].to)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="launcherOpen"
      class="fixed inset-0 z-50 flex items-start tablet:items-center justify-center bg-ink-950/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('launcher.placeholder')"
      @click.self="close"
    >
      <div class="w-full max-w-2xl mt-16 tablet:mt-0 rounded-lg glass shadow-2xl overflow-hidden">
        <div class="p-4 border-b border-ink-100 dark:border-white/10 flex items-center gap-2">
          <UiIcon name="search" :size="18" class="text-ink-400 shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            :placeholder="$t('launcher.placeholder')"
            class="w-full bg-transparent outline-none text-body-lg"
            @keydown="onKeydown"
          />
          <kbd class="text-caption text-ink-400 bg-ink-50 dark:bg-white/10 px-1.5 py-0.5 rounded shrink-0">Esc</kbd>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <!-- Commands: filtered by query at any length, always available -->
          <div v-if="filteredCommands.length" class="p-2" :class="{ 'border-b border-ink-100 dark:border-white/10': query.trim().length >= 2 }">
            <p class="px-3 pb-1 text-caption text-ink-400 uppercase tracking-wide">{{ $t('launcher.commands.title') }}</p>
            <button
              v-for="cmd in filteredCommands"
              :key="cmd.id"
              class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-ink-50 dark:hover:bg-white/5 text-left"
              @click="cmd.run"
            >
              <span class="size-8 shrink-0 rounded-md bg-primary/15 flex items-center justify-center text-primary-600">
                <UiIcon :name="cmd.icon" :size="16" />
              </span>
              <span class="text-body-sm font-medium">{{ cmd.label }}</span>
            </button>
          </div>

          <!-- Search results, once the query is long enough -->
          <div v-if="query.trim().length >= 2" class="p-2">
            <p v-if="loading" class="px-3 py-6 text-body-sm text-ink-400 text-center">{{ $t('launcher.searching') }}</p>
            <p v-else-if="results.length === 0 && !filteredCommands.length" class="px-3 py-6 text-body-sm text-ink-400 text-center">{{ $t('launcher.noResults') }}</p>
            <button
              v-for="r in results"
              :key="`${r.type}-${r.id}`"
              class="w-full flex items-center gap-3 p-3 rounded-md hover:bg-ink-50 dark:hover:bg-white/5 text-left"
              @click="go(r.to)"
            >
              <span class="size-8 shrink-0 rounded-md bg-primary/15 flex items-center justify-center text-primary-600">
                <UiIcon :name="TYPE_ICONS[r.type]" :size="16" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-body-sm font-medium truncate">{{ r.title }}</span>
                <span class="block text-caption text-ink-400 truncate">{{ $t(`launcher.type.${r.type}`) }} · {{ r.subtitle }}</span>
              </span>
            </button>
          </div>

          <!-- App grid, shown when there's no active search query -->
          <div v-else-if="!query.trim()" class="p-2 grid grid-cols-2 tablet:grid-cols-3 gap-2">
            <NuxtLink
              v-for="app in launcherApps"
              :key="app.key"
              :to="app.to"
              class="flex flex-col items-start gap-2 p-3 rounded-md hover:bg-ink-50 dark:hover:bg-white/5"
              @click="close"
            >
              <span class="size-8 rounded-md bg-primary/15 flex items-center justify-center text-primary-600">
                <UiIcon :name="app.icon" :size="18" />
              </span>
              <span class="text-body-sm font-medium">{{ $t(app.label) }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
