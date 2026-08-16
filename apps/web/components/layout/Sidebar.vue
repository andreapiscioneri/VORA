<script setup lang="ts">
import { navGroups } from '~/composables/useNav'

const collapsed = useState('sidebar-collapsed', () => false)
</script>

<template>
  <aside
    class="hidden tablet:flex flex-col shrink-0 border-r border-ink-100 dark:border-white/10 bg-paper-50 dark:bg-ink-900 transition-[width] duration-300"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <div class="h-16 flex items-center px-4 gap-3 border-b border-ink-100 dark:border-white/10">
      <UiBrandMark :size="32" class="shrink-0" />
      <span v-if="!collapsed" class="font-bold text-h4 tracking-tighter">Vora</span>
      <button
        class="ml-auto text-ink-400 hover:text-ink-900 dark:hover:text-white"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="collapsed = !collapsed"
      >
        <UiIcon :name="collapsed ? 'chevron-right' : 'chevron-left'" :size="18" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-6">
      <div v-for="group in navGroups" :key="group.title">
        <p v-if="!collapsed" class="px-3 mb-2 text-caption uppercase tracking-wide text-ink-400">
          {{ $t(group.title) }}
        </p>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.key">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-body text-ink-600 dark:text-paper-200 hover:bg-ink-50 dark:hover:bg-white/5 transition-colors"
              active-class="bg-primary-50 text-ink-900 dark:bg-primary/10 dark:text-white font-medium"
            >
              <UiIcon :name="item.icon" :size="18" class="shrink-0 opacity-70" />
              <span v-if="!collapsed">{{ $t(item.label) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>
