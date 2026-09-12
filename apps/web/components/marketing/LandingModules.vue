<script setup lang="ts">
const { t } = useI18n()

const ITEMS = [
  { key: 'crm', icon: 'users' },
  { key: 'calendar', icon: 'calendar' },
  { key: 'projects', icon: 'check-square' },
  { key: 'marketing', icon: 'megaphone' },
  { key: 'helpdesk', icon: 'life-buoy' },
  { key: 'people', icon: 'umbrella' },
] as const

const modules = computed(() => ITEMS.map((item) => ({
  ...item,
  title: t(`landing.modules.items.${item.key}.title`),
  description: t(`landing.modules.items.${item.key}.description`),
})))
</script>

<template>
  <section id="modules" class="relative bg-ink-950 scroll-mt-24 py-20 sm:py-28 px-5 sm:px-8 md:px-12">
    <div class="max-w-6xl mx-auto">
      <p class="text-xs sm:text-sm font-semibold tracking-[0.12em] text-primary uppercase">{{ t('landing.modules.eyebrow') }}</p>
      <h2 class="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.03em] text-white mt-3 max-w-2xl">{{ t('landing.modules.title') }}</h2>
      <p class="text-sm sm:text-base text-white/70 leading-relaxed mt-4 max-w-xl">{{ t('landing.modules.subtitle') }}</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-10 sm:mt-14">
        <div
          v-for="mod in modules"
          :key="mod.key"
          class="group relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300
                 border-white/10 bg-white/[0.03]
                 hover:border-primary/40 hover:bg-white/[0.06] hover:-translate-y-1"
        >
          <div
            class="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
            style="background: radial-gradient(circle, rgba(57,255,20,0.35) 0%, transparent 70%)"
            aria-hidden="true"
          />
          <div
            class="relative flex items-center justify-center size-10 rounded-xl text-primary transition-transform duration-300 group-hover:scale-110"
            style="background: linear-gradient(135deg, rgba(57,255,20,0.25), rgba(57,255,20,0.06))"
          >
            <UiIcon :name="mod.icon" :size="20" />
          </div>
          <h3 class="relative text-base sm:text-lg font-semibold text-white mt-4">{{ mod.title }}</h3>
          <p class="relative text-sm text-white/65 leading-relaxed mt-2">{{ mod.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
