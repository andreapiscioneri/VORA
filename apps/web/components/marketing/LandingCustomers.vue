<script setup lang="ts">
const { t } = useI18n()

const ITEMS = [
  { key: 'agencies', icon: 'folder' },
  { key: 'smes', icon: 'check-square' },
  { key: 'sales', icon: 'trending-up' },
  { key: 'hr', icon: 'heart' },
] as const

const useCases = computed(() => ITEMS.map((item) => ({
  ...item,
  title: t(`landing.customers.items.${item.key}.title`),
  description: t(`landing.customers.items.${item.key}.description`),
})))
</script>

<template>
  <section id="customers" class="relative bg-[#0a0f08] scroll-mt-24 py-20 sm:py-28 px-5 sm:px-8 md:px-12">
    <div class="max-w-6xl mx-auto">
      <p class="text-xs sm:text-sm font-semibold tracking-[0.12em] text-primary uppercase">{{ t('landing.customers.eyebrow') }}</p>
      <h2 class="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.03em] text-white mt-3 max-w-2xl">{{ t('landing.customers.title') }}</h2>
      <p class="text-sm sm:text-base text-white/70 leading-relaxed mt-4 max-w-xl">{{ t('landing.customers.subtitle') }}</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-10 sm:mt-14">
        <div
          v-for="uc in useCases"
          :key="uc.key"
          class="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <div class="shrink-0 flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
            <UiIcon :name="uc.icon" :size="20" />
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-semibold text-white">{{ uc.title }}</h3>
            <p class="text-sm text-white/65 leading-relaxed mt-2">{{ uc.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
