<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

type LocaleOption = { code: string; name: string }

const localeList = computed<LocaleOption[]>(() =>
  (locales.value as Array<string | { code: string; name?: string }>).map((l) =>
    (typeof l === 'string' ? { code: l, name: l } : { code: l.code, name: l.name ?? l.code }),
  ),
)

const current = computed(() => localeList.value.find((l) => l.code === locale.value) ?? localeList.value[0])

function toggle() {
  open.value = !open.value
}

function choose(code: string) {
  open.value = false
  setLocale(code as typeof locale.value)
}

function onDocumentClick(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full pl-2.5 pr-2 py-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <UiFlag v-if="current" :code="current.code" :size="18" />
      <UiIcon name="chevron-down" :size="14" :class="{ 'rotate-180': open }" class="transition-transform" />
    </button>

    <div
      v-if="open"
      role="listbox"
      class="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-white/10 bg-ink-950/95 backdrop-blur-md shadow-xl py-1.5 z-50"
    >
      <button
        v-for="l in localeList"
        :key="l.code"
        type="button"
        role="option"
        :aria-selected="l.code === locale"
        class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
        :class="l.code === locale ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/10 hover:text-white'"
        @click="choose(l.code)"
      >
        <UiFlag :code="l.code" :size="18" />
        <span>{{ l.name }}</span>
      </button>
    </div>
  </div>
</template>
