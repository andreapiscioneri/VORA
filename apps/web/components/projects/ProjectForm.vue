<script setup lang="ts">
import type { Project, ProjectInput } from '~/shared/types/project'
import { projectInputSchema } from '~/shared/validation/project'

const props = defineProps<{ project?: Project | null; defaultStatus?: Project['status'] }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createProject, updateProject, removeProject } = useProjects()
const { contacts, fetchContacts } = useContacts()
const { t } = useI18n()

if (!contacts.value.length) await fetchContacts()

const isEdit = computed(() => !!props.project)

const form = reactive<ProjectInput>({
  name: props.project?.name ?? '',
  description: props.project?.description ?? '',
  status: props.project?.status ?? props.defaultStatus ?? 'active',
  contactId: props.project?.contactId ?? null,
  startDate: props.project?.startDate ?? null,
  dueDate: props.project?.dueDate ?? null,
  budget: props.project?.budget ?? 0,
  documents: props.project?.documents ?? [],
  discussion: props.project?.discussion ?? [],
  milestones: props.project?.milestones ?? [],
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = projectInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.project) {
      await updateProject(props.project.id, result.data)
    } else {
      await createProject(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('projects.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.project) return
  if (!confirm(t('projects.deleteConfirm'))) return
  await removeProject(props.project.id)
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
      aria-labelledby="project-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="project-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('projects.form.editTitle') : $t('projects.form.newTitle') }}
          </h2>

          <div>
            <label for="project-name" class="block text-label text-ink-400 mb-2">{{ $t('projects.form.name') }}</label>
            <input id="project-name" v-model="form.name" type="text" class="vora-input" :class="{ 'border-danger': errors.name }" autofocus >
            <p v-if="errors.name" class="text-caption text-danger mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label for="project-description" class="block text-label text-ink-400 mb-2">{{ $t('projects.form.description') }}</label>
            <textarea id="project-description" v-model="form.description" rows="3" class="vora-input resize-none" />
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="project-status" class="block text-label text-ink-400 mb-2">{{ $t('projects.form.status') }}</label>
              <select id="project-status" v-model="form.status" class="vora-input">
                <option v-for="s in ['active', 'on_hold', 'completed', 'archived']" :key="s" :value="s">
                  {{ $t(`projects.status.${s}`) }}
                </option>
              </select>
            </div>
            <div>
              <label for="project-contactId" class="block text-label text-ink-400 mb-2">{{ $t('projects.form.client') }}</label>
              <select id="project-contactId" v-model="form.contactId" class="vora-input">
                <option :value="null">{{ $t('projects.form.noClient') }}</option>
                <option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }}</option>
              </select>
            </div>
            <div>
              <label for="project-startDate" class="block text-label text-ink-400 mb-2">{{ $t('projects.form.startDate') }}</label>
              <input id="project-startDate" v-model="form.startDate" type="date" class="vora-input" >
            </div>
            <div>
              <label for="project-dueDate" class="block text-label text-ink-400 mb-2">{{ $t('projects.form.dueDate') }}</label>
              <input id="project-dueDate" v-model="form.dueDate" type="date" class="vora-input" :class="{ 'border-danger': errors.dueDate }" >
              <p v-if="errors.dueDate" class="text-caption text-danger mt-1">{{ errors.dueDate }}</p>
            </div>
            <div>
              <label for="project-budget" class="block text-label text-ink-400 mb-2">{{ $t('projects.form.budget') }}</label>
              <input id="project-budget" v-model.number="form.budget" type="number" min="0" step="100" class="vora-input" >
            </div>
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('projects.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('projects.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('projects.form.saving') : $t('projects.form.save') }}
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
