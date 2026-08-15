<script setup lang="ts">
import type { Project } from '~/shared/types/project'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { locale, t } = useI18n()
const { contacts, fetchContacts } = useContacts()
const { tasks, fetchTasks } = useTasks()
const { addDocument, addComment } = useProjects()
await Promise.all([fetchContacts(), fetchTasks()])

const { data: project, pending, error, refresh } = await useFetch<Project>(`/api/projects/${route.params.id}`)

const showEdit = ref(false)
const newDocTitle = ref('')
const newDocUrl = ref('')
const addingDoc = ref(false)
const docError = ref('')
const newComment = ref('')
const sendingComment = ref(false)

function clientName(contactId: string | null) {
  if (!contactId) return ''
  const c = contacts.value.find((c) => c.id === contactId)
  return c ? `${c.firstName} ${c.lastName}` : ''
}

function taskCount(projectId: string) {
  return tasks.value.filter((t) => t.projectId === projectId).length
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatBudget(value: number) {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success',
  on_hold: 'bg-warning/10 text-warning',
  completed: 'bg-info/10 text-info',
  archived: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
}

async function onAddDocument() {
  docError.value = ''
  if (!newDocTitle.value.trim() || !newDocUrl.value.trim() || !project.value) return
  addingDoc.value = true
  try {
    await addDocument(project.value.id, newDocTitle.value.trim(), newDocUrl.value.trim())
    newDocTitle.value = ''
    newDocUrl.value = ''
    await refresh()
  } catch {
    docError.value = t('projects.detail.documentError')
  } finally {
    addingDoc.value = false
  }
}

async function onAddComment() {
  if (!newComment.value.trim() || !project.value) return
  sendingComment.value = true
  try {
    await addComment(project.value.id, newComment.value.trim())
    newComment.value = ''
    await refresh()
  } finally {
    sendingComment.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <NuxtLink to="/projects" class="inline-flex items-center gap-2 text-body-sm text-ink-400 hover:text-ink-900 dark:hover:text-white">
      <UiIcon name="arrow-left" :size="16" />
      {{ $t('projects.detail.back') }}
    </NuxtLink>

    <div v-if="pending" class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    <div v-else-if="error || !project" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t('projects.errors.load') }}
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-h1 font-semibold tracking-tight">{{ project.name }}</h1>
          <p class="text-body text-ink-400 mt-1">{{ clientName(project.contactId) || '—' }} · {{ taskCount(project.id) }} {{ $t('projects.columns.tasks').toLowerCase() }}</p>
        </div>
        <span class="px-3 py-1.5 rounded-full text-caption font-medium shrink-0" :class="statusStyles[project.status]">
          {{ $t(`projects.status.${project.status}`) }}
        </span>
      </div>

      <div class="flex items-center gap-4 text-body-sm text-ink-400">
        <span v-if="project.dueDate">{{ $t('projects.columns.dueDate') }}: {{ new Date(project.dueDate).toLocaleDateString(locale) }}</span>
        <span v-if="project.budget">{{ $t('projects.columns.budget') }}: {{ formatBudget(project.budget) }}</span>
      </div>

      <p v-if="project.description" class="text-body whitespace-pre-line rounded-lg border border-ink-100 dark:border-white/10 p-4">
        {{ project.description }}
      </p>

      <button class="text-body-sm text-ink-400 hover:text-ink-900 dark:hover:text-white" @click="showEdit = true">
        {{ $t('projects.form.editTitle') }}
      </button>

      <div class="space-y-4">
        <h2 class="text-h4 font-medium">{{ $t('projects.detail.documents') }}</h2>
        <p v-if="project.documents.length === 0" class="text-body-sm text-ink-400">{{ $t('projects.detail.noDocuments') }}</p>
        <ul v-else class="space-y-2">
          <li v-for="d in project.documents" :key="d.id" class="flex items-center justify-between gap-3 rounded-lg border border-ink-100 dark:border-white/10 p-3">
            <a :href="d.url" target="_blank" rel="noopener noreferrer" class="text-body-sm font-medium text-primary-600 dark:text-primary hover:underline truncate">
              {{ d.title }}
            </a>
            <span class="text-caption text-ink-400 shrink-0">{{ formatDate(d.addedAt) }}</span>
          </li>
        </ul>

        <form class="flex flex-col tablet:flex-row items-start gap-2" @submit.prevent="onAddDocument">
          <input
            id="project-doc-title"
            v-model="newDocTitle"
            type="text"
            :placeholder="$t('projects.detail.documentTitle')"
            class="flex-1 w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary transition-colors"
          />
          <input
            id="project-doc-url"
            v-model="newDocUrl"
            type="url"
            :placeholder="$t('projects.detail.documentUrl')"
            class="flex-1 w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            :disabled="addingDoc || !newDocTitle.trim() || !newDocUrl.trim()"
            class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {{ $t('projects.detail.addDocument') }}
          </button>
        </form>
        <p v-if="docError" class="text-caption text-danger">{{ docError }}</p>
      </div>

      <div class="space-y-4">
        <h2 class="text-h4 font-medium">{{ $t('projects.detail.discussion') }}</h2>
        <p v-if="project.discussion.length === 0" class="text-body-sm text-ink-400">{{ $t('projects.detail.noDiscussion') }}</p>
        <div v-else class="space-y-3">
          <div v-for="c in project.discussion" :key="c.id" class="rounded-lg border border-ink-100 dark:border-white/10 p-4">
            <p class="text-caption font-medium text-ink-500 dark:text-paper-300">{{ c.authorName }}</p>
            <p class="text-body-sm whitespace-pre-line mt-1">{{ c.body }}</p>
            <p class="text-caption text-ink-400 mt-2">{{ formatDate(c.createdAt) }}</p>
          </div>
        </div>

        <form class="flex items-start gap-3" @submit.prevent="onAddComment">
          <textarea
            v-model="newComment"
            rows="2"
            :placeholder="$t('projects.detail.addDiscussion')"
            class="flex-1 px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary resize-none transition-colors"
          />
          <button
            type="submit"
            :disabled="sendingComment || !newComment.trim()"
            class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {{ $t('projects.detail.send') }}
          </button>
        </form>
      </div>

      <ProjectsProjectForm v-if="showEdit" :project="project" @close="showEdit = false" @saved="showEdit = false; refresh()" @deleted="$router.push('/projects')" />
    </template>
  </div>
</template>
