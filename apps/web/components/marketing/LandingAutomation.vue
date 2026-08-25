<script setup lang="ts">
const { t } = useI18n()

const KEYS = ['contact', 'appointment', 'invoice'] as const

const recipes = computed(() => KEYS.map((key) => ({
  key,
  trigger: t(`landing.automation.items.${key}.trigger`),
  condition: t(`landing.automation.items.${key}.condition`),
  action: t(`landing.automation.items.${key}.action`),
})))
</script>

<template>
  <section id="automation" class="relative bg-ink-950 scroll-mt-24 py-20 sm:py-28 px-5 sm:px-8 md:px-12">
    <div class="max-w-6xl mx-auto">
      <p class="text-xs sm:text-sm font-semibold tracking-[0.12em] text-primary uppercase">{{ t('landing.automation.eyebrow') }}</p>
      <h2 class="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.03em] text-white mt-3 max-w-2xl">{{ t('landing.automation.title') }}</h2>
      <p class="text-sm sm:text-base text-white/70 leading-relaxed mt-4 max-w-xl">{{ t('landing.automation.subtitle') }}</p>

      <div class="flex flex-col gap-4 mt-10 sm:mt-14">
        <div
          v-for="recipe in recipes"
          :key="recipe.key"
          class="flex flex-col md:flex-row md:items-center gap-3 md:gap-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <div class="flex-1 flex items-center gap-3 md:pr-4">
            <span class="text-[10px] font-semibold tracking-[0.1em] uppercase text-primary shrink-0">{{ t('landing.automation.labels.trigger') }}</span>
            <span class="text-sm text-white">{{ recipe.trigger }}</span>
          </div>
          <UiIcon name="chevron-right" :size="14" class="hidden md:block text-white/25 shrink-0" />
          <div class="flex-1 flex items-center gap-3 md:px-4">
            <span class="text-[10px] font-semibold tracking-[0.1em] uppercase text-white/50 shrink-0">{{ t('landing.automation.labels.condition') }}</span>
            <span class="text-sm text-white/80">{{ recipe.condition }}</span>
          </div>
          <UiIcon name="chevron-right" :size="14" class="hidden md:block text-white/25 shrink-0" />
          <div class="flex-1 flex items-center gap-3 md:pl-4">
            <span class="text-[10px] font-semibold tracking-[0.1em] uppercase text-white/50 shrink-0">{{ t('landing.automation.labels.action') }}</span>
            <span class="text-sm text-white/80">{{ recipe.action }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
