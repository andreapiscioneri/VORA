<script setup lang="ts">
import type { Opportunity } from '~/shared/types/opportunity'

defineProps<{ opportunity: Opportunity; contactName: string }>()
const emit = defineEmits<{ click: []; dragstart: [DragEvent] }>()
const { locale } = useI18n()

function formatValue(value: number, currency: string) {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <button
    type="button"
    draggable="true"
    class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 space-y-2 hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    @click="emit('click')"
    @dragstart="emit('dragstart', $event)"
  >
    <p class="text-body-sm font-medium leading-snug">{{ opportunity.title }}</p>
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
</template>
