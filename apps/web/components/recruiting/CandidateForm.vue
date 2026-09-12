<script setup lang="ts">
import type { Candidate, CandidateInput } from '~/shared/types/candidate'
import { candidateInputSchema } from '~/shared/validation/candidate'
import { CANDIDATE_SOURCES, CANDIDATE_STAGES } from '~/shared/types/candidate'

const props = defineProps<{ candidate?: Candidate | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createCandidate, updateCandidate, removeCandidate } = useCandidates()
const { t } = useI18n()

const isEdit = computed(() => !!props.candidate)

const form = reactive<CandidateInput>({
  firstName: props.candidate?.firstName ?? '',
  lastName: props.candidate?.lastName ?? '',
  email: props.candidate?.email ?? '',
  phone: props.candidate?.phone ?? '',
  role: props.candidate?.role ?? '',
  stage: props.candidate?.stage ?? 'applied',
  source: props.candidate?.source ?? 'other',
  resumeUrl: props.candidate?.resumeUrl ?? '',
  notes: props.candidate?.notes ?? '',
  interviewDate: props.candidate?.interviewDate ?? null,
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = candidateInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.candidate) {
      await updateCandidate(props.candidate.id, result.data)
    } else {
      await createCandidate(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('recruiting.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.candidate) return
  if (!confirm(t('recruiting.deleteConfirm'))) return
  await removeCandidate(props.candidate.id)
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
      aria-labelledby="candidate-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="candidate-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('recruiting.form.editTitle') : $t('recruiting.form.newTitle') }}
          </h2>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="candidate-firstName" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.firstName') }}</label>
              <input id="candidate-firstName" v-model="form.firstName" type="text" class="vora-input" :class="{ 'border-danger': errors.firstName }" autofocus >
              <p v-if="errors.firstName" class="text-caption text-danger mt-1">{{ errors.firstName }}</p>
            </div>
            <div>
              <label for="candidate-lastName" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.lastName') }}</label>
              <input id="candidate-lastName" v-model="form.lastName" type="text" class="vora-input" :class="{ 'border-danger': errors.lastName }" >
              <p v-if="errors.lastName" class="text-caption text-danger mt-1">{{ errors.lastName }}</p>
            </div>
            <div>
              <label for="candidate-email" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.email') }}</label>
              <input id="candidate-email" v-model="form.email" type="email" class="vora-input" :class="{ 'border-danger': errors.email }" >
              <p v-if="errors.email" class="text-caption text-danger mt-1">{{ errors.email }}</p>
            </div>
            <div>
              <label for="candidate-phone" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.phone') }}</label>
              <input id="candidate-phone" v-model="form.phone" type="text" class="vora-input" >
            </div>
            <div>
              <label for="candidate-role" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.role') }}</label>
              <input id="candidate-role" v-model="form.role" type="text" class="vora-input" >
            </div>
            <div>
              <label for="candidate-stage" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.stage') }}</label>
              <select id="candidate-stage" v-model="form.stage" class="vora-input">
                <option v-for="s in CANDIDATE_STAGES" :key="s" :value="s">{{ $t(`recruiting.stage.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="candidate-source" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.source') }}</label>
              <select id="candidate-source" v-model="form.source" class="vora-input">
                <option v-for="s in CANDIDATE_SOURCES" :key="s" :value="s">{{ $t(`recruiting.source.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="candidate-interviewDate" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.interviewDate') }}</label>
              <input id="candidate-interviewDate" v-model="form.interviewDate" type="date" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="candidate-resumeUrl" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.resumeUrl') }}</label>
            <input id="candidate-resumeUrl" v-model="form.resumeUrl" type="text" placeholder="https://..." class="vora-input" >
          </div>

          <div>
            <label for="candidate-notes" class="block text-label text-ink-400 mb-2">{{ $t('recruiting.form.notes') }}</label>
            <textarea id="candidate-notes" v-model="form.notes" rows="3" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('recruiting.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('recruiting.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('recruiting.form.saving') : $t('recruiting.form.save') }}
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
