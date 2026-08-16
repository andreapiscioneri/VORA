<script setup lang="ts">
import type { Opportunity, OpportunityStage } from '~/shared/types/opportunity'

const props = defineProps<{ opportunity: Opportunity; contactName: string; otherStages: OpportunityStage[] }>()
const emit = defineEmits<{ click: []; dragstart: [DragEvent]; move: [OpportunityStage] }>()
const { locale } = useI18n()

function formatValue(value: number, currency: string) {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function selectStage(stage: OpportunityStage) {
  menuOpen.value = false
  emit('move', stage)
}

onClickOutside(menuRef, () => {
  menuOpen.value = false
})
</script>

<template>
  <div class="relative">
    <button
      type="button"
      draggable="true"
      class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 space-y-2 hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      @click="emit('click')"
      @dragstart="emit('dragstart', $event)"
    >
      <p class="text-body-sm font-medium leading-snug pr-6">{{ opportunity.title }}</p>
      <p v-if="opportunity.company || contactName" class="text-caption text-ink-400 truncate">
        {{ [contactName, opportunity.company].filter(Boolean).join(' · ') }}
      </p>
      <div class="flex items-center justify-between pt-1">
        <span class="text-body-sm font-semibold text-primary-600 dark:text-primary">
          {{ formatValue(opportunity.value, opportunity.currency) }}
        </span>
        <span class="text-caption text-ink-400">{{ opportunity.probability }}%</span>
      </div>
    </button>

    <div ref="menuRef" class="absolute top-3 right-3">
      <button
        type="button"
        class="size-6 flex items-center justify-center rounded hover:bg-ink-100 dark:hover:bg-white/10 text-ink-400"
        :aria-label="$t('crm.moveTo', { title: opportunity.title })"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        @click.stop="toggleMenu"
        @keydown.escape="menuOpen = false"
      >
        <UiIcon name="more-horizontal" :size="16" />
      </button>
      <div
        v-if="menuOpen"
        role="menu"
        class="absolute right-0 top-8 w-44 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900 shadow-lg py-1 z-20"
        @keydown.escape="menuOpen = false"
      >
        <button
          v-for="stage in otherStages"
          :key="stage"
          type="button"
          role="menuitem"
          class="w-full text-left px-3 py-2 text-body-sm text-ink-600 dark:text-paper-200 hover:bg-ink-50 dark:hover:bg-white/5"
          @click="selectStage(stage)"
        >
          {{ $t(`crm.stage.${stage}`) }}
        </button>
      </div>
    </div>
  </div>
</template>
