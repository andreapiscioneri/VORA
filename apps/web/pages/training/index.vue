<script setup lang="ts">
import type { TrainingCourse } from '~/shared/types/training'

definePageMeta({ layout: 'default' })
const router = useRouter()

const { courses, pending, error, hasMore, loadingMore, fetchCourses, loadMore } = useTraining()
await fetchCourses()

const showForm = ref(false)
const editingCourse = ref<TrainingCourse | null>(null)

function openNew() {
  editingCourse.value = null
  showForm.value = true
}

function openEdit(course: TrainingCourse) {
  editingCourse.value = course
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingCourse.value = null
}

const statusStyles: Record<string, string> = {
  planned: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  in_progress: 'bg-warning/10 text-warning',
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
          <h1 class="text-h1 font-semibold tracking-tight">{{ $t('training.title') }}</h1>
        </div>
        <p class="text-body text-ink-400 mt-1">{{ $t('training.subtitle', { count: courses.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('training.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="courses.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('training.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('training.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('training.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('training.columns.title') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('training.columns.employee') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('training.columns.provider') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('training.columns.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in courses"
            :key="c.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
            @click="openEdit(c)"
          >
            <td class="px-4 py-3 font-medium">{{ c.title }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ c.employeeName }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ c.provider || '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[c.status]">{{ $t(`training.status.${c.status}`) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && courses.length" class="tablet:hidden space-y-3">
      <button v-for="c in courses" :key="c.id" class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(c)">
        <p class="font-medium">{{ c.title }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ c.employeeName }} · {{ c.provider || '—' }}</p>
        <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[c.status]">{{ $t(`training.status.${c.status}`) }}</span>
      </button>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('training.loadingMore') : $t('training.loadMore') }}
      </button>
    </div>

    <TrainingCourseForm v-if="showForm" :course="editingCourse" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
