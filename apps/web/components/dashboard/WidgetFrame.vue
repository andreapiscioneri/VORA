<script setup lang="ts">
withDefaults(
  defineProps<{
    wide?: boolean
    customizing?: boolean
    visible?: boolean
    dragHandleLabel: string
    hideLabel: string
    showLabel: string
    resizeLabel: string
  }>(),
  { wide: false, customizing: false, visible: true },
)

defineEmits<{ 'toggle-visible': []; 'toggle-size': [] }>()
</script>

<template>
  <div
    class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5 transition-opacity"
    :class="[wide ? 'tablet:col-span-2' : '', customizing && !visible ? 'opacity-50 border-dashed' : '']"
    :draggable="customizing"
  >
    <div v-if="customizing" class="flex items-center gap-3 mb-4 pb-3 border-b border-ink-100 dark:border-white/10">
      <span class="cursor-grab text-ink-400 shrink-0" :aria-label="dragHandleLabel" role="img">
        <UiIcon name="more-horizontal" :size="16" />
      </span>
      <label class="ml-auto flex items-center gap-2 text-caption text-ink-400 cursor-pointer select-none">
        <input
          type="checkbox"
          :checked="visible"
          class="size-4 rounded accent-primary cursor-pointer"
          :aria-label="visible ? hideLabel : showLabel"
          @change="$emit('toggle-visible')"
        >
      </label>
      <button
        type="button"
        class="text-ink-400 hover:text-ink-950 dark:hover:text-white transition-colors shrink-0"
        :aria-label="resizeLabel"
        @click="$emit('toggle-size')"
      >
        <UiIcon name="grid" :size="14" />
      </button>
    </div>
    <slot />
  </div>
</template>
