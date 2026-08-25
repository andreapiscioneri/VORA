<script setup lang="ts">
import type { EmailTemplate, EmailTemplateInput } from '~/shared/types/emailTemplate'
import { emailTemplateInputSchema } from '~/shared/validation/emailTemplate'

const props = defineProps<{ template?: EmailTemplate | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createTemplate, updateTemplate, removeTemplate } = useEmailTemplates()
const { t } = useI18n()

const isEdit = computed(() => !!props.template)

const form = reactive<EmailTemplateInput>({
  name: props.template?.name ?? '',
  subject: props.template?.subject ?? '',
  body: props.template?.body ?? '',
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = emailTemplateInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.template) {
      await updateTemplate(props.template.id, result.data)
    } else {
      await createTemplate(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('templates.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.template) return
  if (!confirm(t('templates.deleteConfirm'))) return
  await removeTemplate(props.template.id)
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
      aria-labelledby="template-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="template-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('templates.form.editTitle') : $t('templates.form.newTitle') }}
          </h2>

          <div>
            <label for="template-name" class="block text-label text-ink-400 mb-2">{{ $t('templates.form.name') }}</label>
            <input id="template-name" v-model="form.name" type="text" class="vora-input" :class="{ 'border-danger': errors.name }" autofocus >
            <p v-if="errors.name" class="text-caption text-danger mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label for="template-subject" class="block text-label text-ink-400 mb-2">{{ $t('templates.form.subject') }}</label>
            <input id="template-subject" v-model="form.subject" type="text" class="vora-input" :class="{ 'border-danger': errors.subject }" >
            <p v-if="errors.subject" class="text-caption text-danger mt-1">{{ errors.subject }}</p>
          </div>

          <div>
            <label for="template-body" class="block text-label text-ink-400 mb-2">{{ $t('templates.form.body') }}</label>
            <textarea id="template-body" v-model="form.body" rows="6" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('templates.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('templates.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('templates.form.saving') : $t('templates.form.save') }}
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
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors disabled:opacity-60;
}
</style>
