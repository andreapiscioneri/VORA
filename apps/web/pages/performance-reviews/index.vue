<script setup lang="ts">
import type { PerformanceReview } from '~/shared/types/performanceReview'

definePageMeta({ layout: 'default' })
const router = useRouter()

const { reviews, pending, error, hasMore, loadingMore, fetchReviews, loadMore } = usePerformanceReviews()
await fetchReviews()

const { locale } = useI18n()
const showForm = ref(false)
const editingReview = ref<PerformanceReview | null>(null)

function openNew() {
  editingReview.value = null
  showForm.value = true
}

function openEdit(review: PerformanceReview) {
  editingReview.value = review
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingReview.value = null
}

const statusStyles: Record<string, string> = {
  draft: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  submitted: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <div class="flex items-center gap-3">
          <button
            class="shrink-0 size-9 flex items-center justify-center rounded-md hover:bg-ink-50 dark:hover:bg-white/5 text-ink-600 dark:text-paper-300"
            :aria-label="$t('common.back')"
            @click="router.back()"
          >
            <UiIcon name="arrow-left" :size="20" />
          </button>
          <h1 class="text-h1 font-semibold tracking-tight">{{ $t('performanceReviews.title') }}</h1>
        </div>
        <p class="text-body text-ink-400 mt-1">{{ $t('performanceReviews.subtitle', { count: reviews.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('performanceReviews.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="reviews.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('performanceReviews.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('performanceReviews.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('performanceReviews.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('performanceReviews.columns.employee') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('performanceReviews.columns.period') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('performanceReviews.columns.rating') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('performanceReviews.columns.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in reviews"
            :key="r.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
            @click="openEdit(r)"
          >
            <td class="px-4 py-3 font-medium">{{ r.employeeName }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ r.period }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ r.rating }} / 5</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[r.status]">{{ $t(`performanceReviews.status.${r.status}`) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && reviews.length" class="tablet:hidden space-y-3">
      <button v-for="r in reviews" :key="r.id" class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(r)">
        <p class="font-medium">{{ r.employeeName }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ r.period }} · {{ r.rating }} / 5</p>
        <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[r.status]">{{ $t(`performanceReviews.status.${r.status}`) }}</span>
      </button>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('performanceReviews.loadingMore') : $t('performanceReviews.loadMore') }}
      </button>
    </div>

    <PerformanceReviewsPerformanceReviewForm v-if="showForm" :review="editingReview" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
