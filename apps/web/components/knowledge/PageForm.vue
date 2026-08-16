<script setup lang="ts">
import type { KnowledgeDocument, KnowledgeDocumentInput } from '~/shared/types/knowledge'
import { knowledgeDocumentInputSchema } from '~/shared/validation/knowledge'

const props = defineProps<{ document?: KnowledgeDocument | null }>()
const emit = defineEmits<{ close: []; saved: [KnowledgeDocument] }>()

const { createDocument, updateDocument } = useKnowledge()
const { t } = useI18n()

const isEdit = computed(() => !!props.document)

const form = reactive({
  title: props.document?.title ?? '',
  content: props.document?.content ?? '',
  folder: props.document?.folder ?? '',
  tagsText: props.document?.tags.join(', ') ?? '',
  favorite: props.document?.favorite ?? false,
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  saveError.value = ''

  const input: KnowledgeDocumentInput = {
    title: form.title,
    content: form.content,
    folder: form.folder,
    tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    favorite: form.favorite,
  }

  const result = knowledgeDocumentInputSchema.safeParse(input)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    const saved =
      isEdit.value && props.document ? await updateDocument(props.document.id, result.data) : await createDocument(result.data)
    emit('saved', saved)
  } catch {
    saveError.value = t('knowledge.errors.save')
  } finally {
    saving.value = false
  }
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
      aria-labelledby="page-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="page-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('knowledge.form.editTitle') : $t('knowledge.form.newTitle') }}
          </h2>

          <div>
            <label for="page-title" class="block text-label text-ink-400 mb-2">{{ $t('knowledge.form.title') }}</label>
            <input id="page-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus />
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="page-folder" class="block text-label text-ink-400 mb-2">{{ $t('knowledge.form.folder') }}</label>
              <input id="page-folder" v-model="form.folder" type="text" class="vora-input" />
            </div>
            <div>
              <label for="page-tagsText" class="block text-label text-ink-400 mb-2">{{ $t('knowledge.form.tags') }}</label>
              <input id="page-tagsText" v-model="form.tagsText" type="text" class="vora-input" />
            </div>
          </div>

          <div>
            <label for="page-content" class="block text-label text-ink-400 mb-2">{{ $t('knowledge.form.content') }}</label>
            <textarea id="page-content" v-model="form.content" rows="10" class="vora-input font-mono text-body-sm resize-y" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
              {{ $t('knowledge.form.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {{ saving ? $t('knowledge.form.saving') : $t('knowledge.form.save') }}
            </button>
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
