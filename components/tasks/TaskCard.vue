<script setup lang="ts">
import type { Task } from '~/shared/types/task'

defineProps<{ task: Task }>()
const emit = defineEmits<{ click: []; dragstart: [DragEvent] }>()
const { locale } = useI18n()

const priorityStyles: Record<string, string> = {
  low: 'text-ink-400',
  medium: 'text-info',
  high: 'text-warning',
  urgent: 'text-danger',
}
</script>

<template>
  <button
    type="button"
    draggable="true"
    class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 space-y-3 hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    @click="emit('click')"
    @dragstart="emit('dragstart', $event)"
  >
    <p class="text-body-sm font-medium leading-snug">{{ task.title }}</p>
    <div class="flex items-center gap-3 text-caption text-ink-400">
      <span class="flex items-center gap-1" :class="priorityStyles[task.priority]">
        <UiIcon name="flag" :size="13" />
        {{ $t(`tasks.priority.${task.priority}`) }}
      </span>
      <span v-if="task.deadline" class="flex items-center gap-1">
        <UiIcon name="clock" :size="13" />
        {{ new Date(task.deadline).toLocaleDateString(locale) }}
      </span>
    </div>
  </button>
</template>
