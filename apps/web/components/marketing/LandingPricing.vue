<script setup lang="ts">
const { t } = useI18n()
const { loggedIn } = useUserSession()

const primaryHref = computed(() => (loggedIn.value ? '/dashboard' : '/register'))
const primaryLabel = computed(() => (loggedIn.value ? t('landing.ctaLoggedIn') : t('landing.cta')))

const PLAN_KEYS = ['starter', 'business', 'enterprise'] as const

const plans = computed(() => PLAN_KEYS.map((key) => ({
  key,
  name: t(`landing.pricing.plans.${key}.name`),
  description: t(`landing.pricing.plans.${key}.description`),
  features: [1, 2, 3, 4].map((n) => t(`landing.pricing.plans.${key}.feature${n}`)),
  highlighted: key === 'business',
})))
</script>

<template>
  <section id="pricing" class="relative bg-[#0a0f08] scroll-mt-24 py-20 sm:py-28 px-5 sm:px-8 md:px-12">
    <div class="max-w-6xl mx-auto">
      <p class="text-xs sm:text-sm font-semibold tracking-[0.12em] text-primary uppercase">{{ t('landing.pricing.eyebrow') }}</p>
      <h2 class="text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-[-0.03em] text-white mt-3 max-w-2xl">{{ t('landing.pricing.title') }}</h2>
      <p class="text-sm sm:text-base text-white/70 leading-relaxed mt-4 max-w-xl">{{ t('landing.pricing.subtitle') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 sm:mt-14 items-stretch">
        <div
          v-for="plan in plans"
          :key="plan.key"
          class="relative flex flex-col rounded-2xl border p-6 sm:p-7"
          :class="plan.highlighted ? 'border-primary/50 bg-primary/[0.06]' : 'border-white/10 bg-white/[0.03]'"
        >
          <span
            v-if="plan.highlighted"
            class="absolute -top-3 left-6 bg-primary text-ink-950 text-[10px] font-semibold tracking-[0.08em] uppercase px-3 py-1 rounded-full"
          >
            {{ t('landing.pricing.mostRequested') }}
          </span>
          <h3 class="text-lg font-semibold text-white">{{ plan.name }}</h3>
          <p class="text-sm text-white/65 leading-relaxed mt-2">{{ plan.description }}</p>
          <ul class="flex flex-col gap-2.5 mt-6 flex-1">
            <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-sm text-white/80">
              <UiIcon name="check-square" :size="16" class="text-primary mt-0.5 shrink-0" />
              <span>{{ feature }}</span>
            </li>
          </ul>
          <NuxtLink
            :to="primaryHref"
            class="mt-7 inline-flex justify-center rounded-full text-sm font-semibold px-5 py-2.5 transition-colors"
            :class="plan.highlighted ? 'bg-primary text-ink-950 hover:bg-primary-hover' : 'bg-white/10 text-white hover:bg-white/15'"
          >
            {{ plan.key === 'enterprise' ? t('landing.pricing.ctaEnterprise') : primaryLabel }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
