<script setup lang="ts">
import type { PerformanceReview, PerformanceReviewInput } from '~/shared/types/performanceReview'
import { performanceReviewInputSchema } from '~/shared/validation/performanceReview'
import { REVIEW_STATUSES } from '~/shared/types/performanceReview'

const props = defineProps<{ review?: PerformanceReview | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createReview, updateReview, removeReview } = usePerformanceReviews()
const { employees, fetchEmployees } = useEmployees()
const { t } = useI18n()

if (!employees.value.length) await fetchEmployees()

const isEdit = computed(() => !!props.review)
const selectedEmployeeId = ref<string | null>(props.review?.employeeId ?? null)

const form = reactive<PerformanceReviewInput>({
  employeeId: props.review?.employeeId ?? null,
  employeeName: props.review?.employeeName ?? '',
  period: props.review?.period ?? '',
  reviewerName: props.review?.reviewerName ?? '',
  rating: props.review?.rating ?? 3,
  strengths: props.review?.strengths ?? '',
  improvements: props.review?.improvements ?? '',
  goals: props.review?.goals ?? '',
  status: props.review?.status ?? 'draft',
  reviewDate: props.review?.reviewDate ?? null,
})

watch(selectedEmployeeId, (id) => {
  form.employeeId = id
  const emp = employees.value.find((e) => e.id === id)
  form.employeeName = emp ? `${emp.firstName} ${emp.lastName}` : ''
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = performanceReviewInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.review) {
      await updateReview(props.review.id, result.data)
    } else {
      await createReview(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('performanceReviews.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.review) return
  if (!confirm(t('performanceReviews.deleteConfirm'))) return
  await removeReview(props.review.id)
  emit('deleted')
}

const dialogRef = ref<HTMLElement | null>(null)
onMounted(() => dialogRef.value?.focus())
</script>

<template>
  <Teleport to="body">
    <div
      ref="dialogRef"
      class="fixed inset-0 z-50 flex items-end tablet:items-center justify-center bg-ink-950/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="review-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('performanceReviews.form.editTitle') : $t('performanceReviews.form.newTitle') }}
          </h2>

          <div>
            <label for="review-employee" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.employeeName') }}</label>
            <select v-if="employees.length" id="review-employee" v-model="selectedEmployeeId" class="vora-input" :class="{ 'border-danger': errors.employeeName }">
              <option :value="null" disabled>{{ $t('performanceReviews.form.selectEmployee') }}</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.firstName }} {{ emp.lastName }}</option>
            </select>
            <input v-else id="review-employee" v-model="form.employeeName" type="text" class="vora-input" :class="{ 'border-danger': errors.employeeName }" autofocus >
            <p v-if="errors.employeeName" class="text-caption text-danger mt-1">{{ errors.employeeName }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="review-period" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.period') }}</label>
              <input id="review-period" v-model="form.period" type="text" class="vora-input" :class="{ 'border-danger': errors.period }" >
              <p v-if="errors.period" class="text-caption text-danger mt-1">{{ errors.period }}</p>
            </div>
            <div>
              <label for="review-reviewerName" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.reviewerName') }}</label>
              <input id="review-reviewerName" v-model="form.reviewerName" type="text" class="vora-input" >
            </div>
            <div>
              <label for="review-rating" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.rating') }}</label>
              <select id="review-rating" v-model.number="form.rating" class="vora-input">
                <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            <div>
              <label for="review-status" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.status') }}</label>
              <select id="review-status" v-model="form.status" class="vora-input">
                <option v-for="s in REVIEW_STATUSES" :key="s" :value="s">{{ $t(`performanceReviews.status.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="review-reviewDate" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.reviewDate') }}</label>
              <input id="review-reviewDate" v-model="form.reviewDate" type="date" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="review-strengths" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.strengths') }}</label>
            <textarea id="review-strengths" v-model="form.strengths" rows="2" class="vora-input resize-none" />
          </div>
          <div>
            <label for="review-improvements" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.improvements') }}</label>
            <textarea id="review-improvements" v-model="form.improvements" rows="2" class="vora-input resize-none" />
          </div>
          <div>
            <label for="review-goals" class="block text-label text-ink-400 mb-2">{{ $t('performanceReviews.form.goals') }}</label>
            <textarea id="review-goals" v-model="form.goals" rows="2" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('performanceReviews.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('performanceReviews.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('performanceReviews.form.saving') : $t('performanceReviews.form.save') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.vora-input {
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors;
}
</style>
