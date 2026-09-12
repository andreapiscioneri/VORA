<script setup lang="ts">
import type { TrainingCourse, TrainingCourseInput } from '~/shared/types/training'
import { trainingCourseInputSchema } from '~/shared/validation/training'
import { TRAINING_STATUSES } from '~/shared/types/training'

const props = defineProps<{ course?: TrainingCourse | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createCourse, updateCourse, removeCourse } = useTraining()
const { t } = useI18n()

const isEdit = computed(() => !!props.course)

const form = reactive<TrainingCourseInput>({
  title: props.course?.title ?? '',
  employeeName: props.course?.employeeName ?? '',
  provider: props.course?.provider ?? '',
  status: props.course?.status ?? 'planned',
  startDate: props.course?.startDate ?? null,
  completionDate: props.course?.completionDate ?? null,
  certificateUrl: props.course?.certificateUrl ?? '',
  notes: props.course?.notes ?? '',
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = trainingCourseInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.course) {
      await updateCourse(props.course.id, result.data)
    } else {
      await createCourse(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('training.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.course) return
  if (!confirm(t('training.deleteConfirm'))) return
  await removeCourse(props.course.id)
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
      aria-labelledby="course-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="course-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('training.form.editTitle') : $t('training.form.newTitle') }}
          </h2>

          <div>
            <label for="course-title" class="block text-label text-ink-400 mb-2">{{ $t('training.form.title') }}</label>
            <input id="course-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus >
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="course-employeeName" class="block text-label text-ink-400 mb-2">{{ $t('training.form.employeeName') }}</label>
              <input id="course-employeeName" v-model="form.employeeName" type="text" class="vora-input" :class="{ 'border-danger': errors.employeeName }" >
              <p v-if="errors.employeeName" class="text-caption text-danger mt-1">{{ errors.employeeName }}</p>
            </div>
            <div>
              <label for="course-provider" class="block text-label text-ink-400 mb-2">{{ $t('training.form.provider') }}</label>
              <input id="course-provider" v-model="form.provider" type="text" class="vora-input" >
            </div>
            <div>
              <label for="course-status" class="block text-label text-ink-400 mb-2">{{ $t('training.form.status') }}</label>
              <select id="course-status" v-model="form.status" class="vora-input">
                <option v-for="s in TRAINING_STATUSES" :key="s" :value="s">{{ $t(`training.status.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="course-startDate" class="block text-label text-ink-400 mb-2">{{ $t('training.form.startDate') }}</label>
              <input id="course-startDate" v-model="form.startDate" type="date" class="vora-input" >
            </div>
            <div>
              <label for="course-completionDate" class="block text-label text-ink-400 mb-2">{{ $t('training.form.completionDate') }}</label>
              <input id="course-completionDate" v-model="form.completionDate" type="date" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="course-certificateUrl" class="block text-label text-ink-400 mb-2">{{ $t('training.form.certificateUrl') }}</label>
            <input id="course-certificateUrl" v-model="form.certificateUrl" type="text" placeholder="https://..." class="vora-input" >
          </div>

          <div>
            <label for="course-notes" class="block text-label text-ink-400 mb-2">{{ $t('training.form.notes') }}</label>
            <textarea id="course-notes" v-model="form.notes" rows="3" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('training.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('training.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('training.form.saving') : $t('training.form.save') }}
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
