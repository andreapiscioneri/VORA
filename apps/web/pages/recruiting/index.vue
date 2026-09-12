<script setup lang="ts">
import type { Candidate } from '~/shared/types/candidate'

definePageMeta({ layout: 'default' })

const { candidates, pending, error, hasMore, loadingMore, fetchCandidates, loadMore } = useCandidates()
await fetchCandidates()

const showForm = ref(false)
const editingCandidate = ref<Candidate | null>(null)

function openNew() {
  editingCandidate.value = null
  showForm.value = true
}

function openEdit(candidate: Candidate) {
  editingCandidate.value = candidate
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingCandidate.value = null
}

const stageStyles: Record<string, string> = {
  applied: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  screening: 'bg-warning/10 text-warning',
  interview: 'bg-primary/10 text-primary',
  offer: 'bg-warning/10 text-warning',
  hired: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('recruiting.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('recruiting.subtitle', { count: candidates.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('recruiting.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="candidates.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('recruiting.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('recruiting.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('recruiting.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('recruiting.columns.name') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('recruiting.columns.role') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('recruiting.columns.source') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('recruiting.columns.stage') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in candidates"
            :key="c.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
            @click="openEdit(c)"
          >
            <td class="px-4 py-3 font-medium">{{ c.firstName }} {{ c.lastName }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ c.role || '—' }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ $t(`recruiting.source.${c.source}`) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="stageStyles[c.stage]">{{ $t(`recruiting.stage.${c.stage}`) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && candidates.length" class="tablet:hidden space-y-3">
      <button v-for="c in candidates" :key="c.id" class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(c)">
        <p class="font-medium">{{ c.firstName }} {{ c.lastName }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ c.role || '—' }}</p>
        <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="stageStyles[c.stage]">{{ $t(`recruiting.stage.${c.stage}`) }}</span>
      </button>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('recruiting.loadingMore') : $t('recruiting.loadMore') }}
      </button>
    </div>

    <RecruitingCandidateForm v-if="showForm" :candidate="editingCandidate" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
