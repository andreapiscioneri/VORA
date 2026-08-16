<script setup lang="ts">
import type { Segment } from '~/shared/types/segment'

definePageMeta({ layout: 'default' })

const { segments, pending, error, fetchSegments } = useSegments()
await fetchSegments()

const showForm = ref(false)
const editingSegment = ref<Segment | null>(null)

function openNew() {
  editingSegment.value = null
  showForm.value = true
}

function openEdit(segment: Segment) {
  editingSegment.value = segment
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingSegment.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('segments.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('segments.subtitle', { count: segments.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('segments.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="segments.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('segments.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('segments.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('segments.empty.cta') }}
      </button>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="s in segments"
        :key="s.id"
        class="w-full text-left flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-4 hover:border-primary/40 transition-colors"
        @click="openEdit(s)"
      >
        <div class="flex-1 min-w-0">
          <p class="text-body-sm font-medium truncate">{{ s.name }}</p>
          <p class="text-caption text-ink-400 truncate">
            <span v-if="s.filter.status">{{ $t(`contacts.status.${s.filter.status}`) }}</span>
            <span v-if="s.filter.status && s.filter.tags?.length"> · </span>
            <span v-if="s.filter.tags?.length">{{ s.filter.tags.join(', ') }}</span>
          </p>
        </div>
      </button>
    </div>

    <MarketingSegmentForm v-if="showForm" :segment="editingSegment" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
