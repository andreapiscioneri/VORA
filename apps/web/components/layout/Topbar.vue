<script setup lang="ts">
const colorMode = useColorMode()
const launcherOpen = useState('launcher-open', () => false)
const assistantOpen = useState('assistant-open', () => false)
const mobileNavOpen = useState('mobile-nav-open', () => false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const { user, clear } = useUserSession()
const router = useRouter()

onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false
})

const { locale, locales, setLocale } = useI18n()
const langMenuOpen = ref(false)
const langMenuRef = ref<HTMLElement | null>(null)

onClickOutside(langMenuRef, () => {
  langMenuOpen.value = false
})

type LocaleOption = { code: string; name: string }

const localeList = computed<LocaleOption[]>(() =>
  (locales.value as Array<string | { code: string; name?: string }>).map((l) =>
    (typeof l === 'string' ? { code: l, name: l } : { code: l.code, name: l.name ?? l.code }),
  ),
)

const currentLocale = computed(() => localeList.value.find((l) => l.code === locale.value) ?? localeList.value[0])

function chooseLocale(code: string) {
  langMenuOpen.value = false
  setLocale(code as typeof locale.value)
}

const initials = computed(() => {
  const name = user.value?.name ?? ''
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

async function logout() {
  userMenuOpen.value = false
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  router.push('/login')
}
</script>

<template>
  <header
    class="h-16 shrink-0 flex items-center gap-3 px-4 tablet:px-6 border-b border-ink-100 dark:border-white/10 bg-paper-50/80 dark:bg-ink-900/80 backdrop-blur-md sticky top-0 z-40"
  >
    <button
      class="tablet:hidden text-ink-600 dark:text-paper-200"
      aria-label="Menu"
      @click="mobileNavOpen = true"
    >
      <UiIcon name="menu" :size="22" />
    </button>

    <button
      class="hidden tablet:flex items-center gap-2 px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 text-body-sm text-ink-400"
      @click="launcherOpen = true"
    >
      <UiIcon name="search" :size="16" />
      <span>{{ $t('topbar.search') }}</span>
      <kbd class="ml-8 text-caption bg-ink-50 dark:bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
    </button>

    <div class="ml-auto flex items-center gap-2">
      <button
        class="size-9 flex items-center justify-center rounded-md hover:bg-ink-50 dark:hover:bg-white/5"
        :aria-label="$t('topbar.toggleTheme')"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      >
        <!-- CSS-only swap: avoids a client/server hydration mismatch, since
             colorMode.value only resolves to the real preference after mount. -->
        <span class="hidden dark:inline"><UiIcon name="sun" :size="18" /></span>
        <span class="inline dark:hidden"><UiIcon name="moon" :size="18" /></span>
      </button>
      <button
        class="size-9 flex items-center justify-center rounded-md hover:bg-ink-50 dark:hover:bg-white/5"
        :aria-label="$t('topbar.launcher')"
        @click="launcherOpen = true"
      >
        <UiIcon name="grid" :size="18" />
      </button>
      <!-- Immediately before the profile avatar, per the app's icon ordering
           convention: [other icons] -> AI -> profile. -->
      <button
        class="size-9 flex items-center justify-center rounded-md hover:bg-ink-50 dark:hover:bg-white/5 text-primary-600 dark:text-primary"
        :aria-label="$t('assistant.open')"
        @click="assistantOpen = true"
      >
        <UiIcon name="sparkles" :size="18" />
      </button>
      <div ref="langMenuRef" class="relative">
        <button
          class="h-9 flex items-center gap-1 pl-2 pr-1.5 rounded-md hover:bg-ink-50 dark:hover:bg-white/5"
          :aria-label="$t('topbar.language')"
          :aria-expanded="langMenuOpen"
          aria-haspopup="listbox"
          @click="langMenuOpen = !langMenuOpen"
        >
          <UiFlag v-if="currentLocale" :code="currentLocale.code" :size="18" />
          <UiIcon name="chevron-down" :size="14" class="text-ink-400 transition-transform" :class="{ 'rotate-180': langMenuOpen }" />
        </button>
        <div
          v-if="langMenuOpen"
          role="listbox"
          class="absolute right-0 top-11 w-44 rounded-md border border-ink-100 dark:border-white/10 bg-paper-50 dark:bg-ink-900 shadow-lg py-1.5 z-50"
        >
          <button
            v-for="l in localeList"
            :key="l.code"
            role="option"
            :aria-selected="l.code === locale"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-left"
            :class="l.code === locale ? 'text-ink-950 dark:text-paper-50 bg-ink-50 dark:bg-white/10' : 'text-ink-600 dark:text-paper-200 hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="chooseLocale(l.code)"
          >
            <UiFlag :code="l.code" :size="18" />
            <span>{{ l.name }}</span>
          </button>
        </div>
      </div>
      <div ref="userMenuRef" class="relative">
        <button
          class="size-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-caption font-semibold text-primary-700 dark:text-primary"
          :aria-label="user?.name"
          @click="userMenuOpen = !userMenuOpen"
        >
          {{ initials }}
        </button>
        <div
          v-if="userMenuOpen"
          class="absolute right-0 top-11 w-56 rounded-md border border-ink-100 dark:border-white/10 bg-paper-50 dark:bg-ink-900 shadow-lg py-2 z-50"
        >
          <div class="px-3 py-2 border-b border-ink-100 dark:border-white/10">
            <p class="text-body-sm font-medium truncate">{{ user?.name }}</p>
            <p class="text-caption text-ink-400 truncate">{{ user?.organizationName }}</p>
          </div>
          <button
            class="w-full text-left px-3 py-2 text-body-sm text-ink-600 dark:text-paper-200 hover:bg-ink-50 dark:hover:bg-white/5"
            @click="logout"
          >
            {{ $t('auth.logout') }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
