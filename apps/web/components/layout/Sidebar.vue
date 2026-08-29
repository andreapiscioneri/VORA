<script setup lang="ts">
import { navGroups } from '~/composables/useNav'

const collapsed = useState('sidebar-collapsed', () => false)
const mobileNavOpen = useState('mobile-nav-open', () => false)

const { locale, locales, setLocale } = useI18n()
const langOpen = ref(false)

type LocaleOption = { code: string; name: string }

const localeList = computed<LocaleOption[]>(() =>
  (locales.value as Array<string | { code: string; name?: string }>).map((l) =>
    (typeof l === 'string' ? { code: l, name: l } : { code: l.code, name: l.name ?? l.code }),
  ),
)

const currentLocale = computed(() => localeList.value.find((l) => l.code === locale.value) ?? localeList.value[0])

function selectLocale(code: string) {
  langOpen.value = false
  setLocale(code as typeof locale.value)
}

watch(mobileNavOpen, (open) => {
  if (!open) langOpen.value = false
})
</script>

<template>
  <div
    v-if="mobileNavOpen"
    class="tablet:hidden fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-sm"
    @click="mobileNavOpen = false"
  />

  <aside
    class="flex flex-col shrink-0 border-r border-ink-100 dark:border-white/10 bg-paper-50 dark:bg-ink-900 transition-[width] duration-300 fixed inset-y-0 left-0 z-50 tablet:static tablet:z-auto w-64"
    :class="[mobileNavOpen ? 'flex' : 'hidden tablet:flex', collapsed ? 'tablet:w-16' : 'tablet:w-64']"
  >
    <div class="h-16 flex items-center px-4 gap-3 border-b border-ink-100 dark:border-white/10">
      <UiBrandMark :size="32" class="shrink-0" />
      <span v-if="!collapsed" class="font-bold text-h4 tracking-tighter">Vora</span>
      <button
        class="ml-auto hidden tablet:inline-flex text-ink-400 hover:text-ink-900 dark:hover:text-white"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="collapsed = !collapsed"
      >
        <UiIcon :name="collapsed ? 'chevron-right' : 'chevron-left'" :size="18" />
      </button>
      <button
        class="ml-auto tablet:hidden text-ink-400 hover:text-ink-900 dark:hover:text-white"
        aria-label="Close menu"
        @click="mobileNavOpen = false"
      >
        <UiIcon name="x" :size="18" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-6">
      <div v-for="group in navGroups" :key="group.title">
        <p v-if="!collapsed" class="px-3 mb-2 text-caption uppercase tracking-wide text-ink-400">
          {{ $t(group.title) }}
        </p>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.key">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-body text-ink-600 dark:text-paper-200 hover:bg-ink-50 dark:hover:bg-white/5 transition-colors"
              active-class="bg-primary-50 text-ink-900 dark:bg-primary/10 dark:text-white font-medium"
              @click="mobileNavOpen = false"
            >
              <UiIcon :name="item.icon" :size="18" class="shrink-0 opacity-70" />
              <span v-if="!collapsed">{{ $t(item.label) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="tablet:hidden pt-2 border-t border-ink-100 dark:border-white/10">
        <button
          type="button"
          class="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-white/5"
          :aria-expanded="langOpen"
          aria-haspopup="listbox"
          @click="langOpen = !langOpen"
        >
          <span class="flex items-center gap-2.5">
            <UiFlag v-if="currentLocale" :code="currentLocale.code" :size="18" />
            <span class="text-body-sm font-medium text-ink-900 dark:text-white">{{ currentLocale?.name }}</span>
          </span>
          <UiIcon name="chevron-down" :size="16" class="text-ink-400 transition-transform" :class="{ 'rotate-180': langOpen }" />
        </button>

        <div v-if="langOpen" role="listbox" class="mt-1 rounded-md border border-ink-100 dark:border-white/10 overflow-hidden">
          <button
            v-for="l in localeList"
            :key="l.code"
            type="button"
            role="option"
            :aria-selected="l.code === locale"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-sm text-left transition-colors"
            :class="l.code === locale ? 'bg-primary-50 text-ink-900 dark:bg-primary/10 dark:text-white font-medium' : 'text-ink-600 dark:text-paper-200 bg-paper-0 dark:bg-white/5 hover:bg-ink-50 dark:hover:bg-white/10'"
            @click="selectLocale(l.code)"
          >
            <UiFlag :code="l.code" :size="18" />
            <span>{{ l.name }}</span>
          </button>
        </div>
      </div>
    </nav>
  </aside>
</template>
