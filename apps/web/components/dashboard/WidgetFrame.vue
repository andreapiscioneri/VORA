<script setup lang="ts">
withDefaults(
  defineProps<{
    wide?: boolean
    customizing?: boolean
    visible?: boolean
    icon?: string
    dragHandleLabel: string
    hideLabel: string
    showLabel: string
    resizeLabel: string
  }>(),
  { wide: false, customizing: false, visible: true, icon: undefined },
)

defineEmits<{ 'toggle-visible': []; 'toggle-size': [] }>()
</script>

<template>
  <div
    class="group relative rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300
           border-white/60 dark:border-white/10
           bg-white/70 dark:bg-white/[0.04]
           shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)]
           hover:border-primary/40 hover:shadow-[0_12px_40px_rgba(57,255,20,0.12)] hover:-translate-y-0.5"
    :class="[wide ? 'tablet:col-span-2' : '', customizing && !visible ? 'opacity-50 border-dashed' : '']"
    :draggable="customizing"
  >
    <!-- Faint gradient wash in the corner — the "glass catching a green light"
         look, consistent with the ambient backdrop this card blurs against. -->
    <div
      class="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
      style="background: radial-gradient(circle, rgba(57,255,20,0.25) 0%, transparent 70%)"
      aria-hidden="true"
    />

    <div v-if="customizing" class="relative flex items-center gap-3 mb-4 pb-3 border-b border-ink-100 dark:border-white/10">
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

    <div v-if="icon" class="relative flex items-center justify-center size-9 rounded-xl mb-3 text-primary-600 dark:text-primary"
      style="background: linear-gradient(135deg, rgba(57,255,20,0.18), rgba(57,255,20,0.05))"
    >
      <UiIcon :name="icon" :size="18" />
    </div>

    <div class="relative">
      <slot />
    </div>
  </div>
</template>
