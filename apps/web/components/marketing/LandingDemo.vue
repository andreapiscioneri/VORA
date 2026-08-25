<script setup lang="ts">
const { t } = useI18n()
const { loggedIn } = useUserSession()

const primaryHref = computed(() => (loggedIn.value ? '/dashboard' : '/register'))

const TAB_KEYS = ['crm', 'calendar', 'automation', 'projects'] as const
type TabKey = (typeof TAB_KEYS)[number]

const ICON_FOR: Record<TabKey, string> = {
  crm: 'users',
  calendar: 'calendar',
  automation: 'sparkles',
  projects: 'check-square',
}

const activeTab = ref<TabKey>('crm')

const tabs = computed(() => TAB_KEYS.map((key) => ({
  key,
  label: t(`landing.demo.tabs.${key}.label`),
})))

const activeCaption = computed(() => t(`landing.demo.tabs.${activeTab.value}.caption`))
</script>

<template>
  <section id="demo" class="relative bg-ink-950 scroll-mt-24 py-20 sm:py-28 px-5 sm:px-8 md:px-12 overflow-hidden">
    <div class="max-w-6xl mx-auto">
      <p class="text-xs sm:text-sm font-semibold tracking-[0.12em] text-primary uppercase">{{ t('landing.demo.eyebrow') }}</p>
      <h2 class="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.03em] text-white mt-3 max-w-2xl">{{ t('landing.demo.title') }}</h2>
      <p class="text-sm sm:text-base text-white/70 leading-relaxed mt-4 max-w-xl">{{ t('landing.demo.subtitle') }}</p>

      <div class="flex flex-wrap gap-2 mt-10 sm:mt-12">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="activeTab === tab.key ? 'bg-primary text-ink-950' : 'bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white'"
          @click="activeTab = tab.key"
        >
          <UiIcon :name="ICON_FOR[tab.key]" :size="16" />
          {{ tab.label }}
        </button>
      </div>

      <div class="mt-6 sm:mt-8 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div class="flex items-center gap-1.5 px-4 py-3 border-b border-white/10">
          <span class="size-2.5 rounded-full bg-white/20" />
          <span class="size-2.5 rounded-full bg-white/20" />
          <span class="size-2.5 rounded-full bg-white/20" />
        </div>
        <div class="p-6 sm:p-10 min-h-[220px] sm:min-h-[280px] flex flex-col justify-center">
          <div class="flex items-center gap-3 mb-5">
            <div class="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
              <UiIcon :name="ICON_FOR[activeTab]" :size="20" />
            </div>
            <div class="flex-1 flex flex-col gap-1.5">
              <span class="h-2.5 w-2/5 rounded-full bg-white/15" />
              <span class="h-2 w-1/4 rounded-full bg-white/10" />
            </div>
          </div>
          <div class="flex flex-col gap-2.5">
            <span class="h-2.5 w-full rounded-full bg-white/10" />
            <span class="h-2.5 w-4/5 rounded-full bg-white/10" />
            <span class="h-2.5 w-3/5 rounded-full bg-white/10" />
          </div>
          <p class="text-sm text-white/70 leading-relaxed mt-6 max-w-md">{{ activeCaption }}</p>
        </div>
      </div>

      <NuxtLink
        :to="primaryHref"
        class="inline-flex mt-8 sm:mt-10 px-7 py-3 rounded-full bg-primary text-ink-950 text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        {{ t('landing.demo.ctaTry') }}
      </NuxtLink>
    </div>
  </section>
</template>
