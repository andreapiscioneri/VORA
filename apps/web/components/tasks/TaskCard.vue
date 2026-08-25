<script setup lang="ts">
import type { Task, TaskStatus } from '~/shared/types/task'

defineProps<{ task: Task; otherStatuses: TaskStatus[] }>()
const emit = defineEmits<{ click: []; dragstart: [DragEvent]; move: [TaskStatus] }>()
const { locale } = useI18n()

const priorityStyles: Record<string, string> = {
  low: 'text-ink-400',
  medium: 'text-info',
  high: 'text-warning',
  urgent: 'text-danger',
}

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function selectStatus(status: TaskStatus) {
  menuOpen.value = false
  emit('move', status)
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
      class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 space-y-3 hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      @click="emit('click')"
      @dragstart="emit('dragstart', $event)"
    >
      <p class="text-body-sm font-medium leading-snug pr-6">{{ task.title }}</p>
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

    <div ref="menuRef" class="absolute top-3 right-3">
      <button
        type="button"
        class="size-6 flex items-center justify-center rounded hover:bg-ink-100 dark:hover:bg-white/10 text-ink-400"
        :aria-label="$t('tasks.moveTo', { title: task.title })"
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
          v-for="status in otherStatuses"
          :key="status"
          type="button"
          role="menuitem"
          class="w-full text-left px-3 py-2 text-body-sm text-ink-600 dark:text-paper-200 hover:bg-ink-50 dark:hover:bg-white/5"
          @click="selectStatus(status)"
        >
          {{ $t(`tasks.status.${status}`) }}
        </button>
      </div>
    </div>
  </div>
</template>
