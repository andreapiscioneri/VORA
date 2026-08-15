<script setup lang="ts">
import type { KnowledgeDocument } from '~/shared/types/knowledge'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const { removeDocument } = useKnowledge()
const { render } = useMarkdown()

const { data: doc, pending, error, refresh } = await useFetch<KnowledgeDocument>(`/api/knowledge/${route.params.id}`)

const showEdit = ref(false)

const renderedHtml = computed(() => (doc.value ? render(doc.value.content) : ''))

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function onSaved() {
  showEdit.value = false
  await refresh()
}

async function onDelete() {
  if (!doc.value) return
  if (!confirm($t('knowledge.deleteConfirm'))) return
  await removeDocument(doc.value.id)
  await router.push('/knowledge')
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <NuxtLink to="/knowledge" class="inline-flex items-center gap-2 text-body-sm text-ink-400 hover:text-ink-900 dark:hover:text-white">
      <UiIcon name="arrow-left" :size="16" />
      {{ $t('knowledge.detail.back') }}
    </NuxtLink>

    <div v-if="pending" class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    <div v-else-if="error || !doc" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t('knowledge.errors.load') }}
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-h1 font-semibold tracking-tight">{{ doc.title }}</h1>
          <p class="text-caption text-ink-400 mt-1">{{ $t('knowledge.detail.lastUpdated') }}: {{ formatDate(doc.updatedAt) }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button class="px-3 py-2 rounded-md text-body-sm border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5" @click="showEdit = true">
            {{ $t('knowledge.form.edit') }}
          </button>
          <button class="px-3 py-2 rounded-md text-body-sm text-danger border border-danger/30 hover:bg-danger/5" @click="onDelete">
            {{ $t('knowledge.form.delete') }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <span v-if="doc.folder" class="text-caption px-2 py-0.5 rounded-full bg-ink-50 dark:bg-white/10 text-ink-500 dark:text-paper-300">{{ doc.folder }}</span>
        <span v-for="tag in doc.tags" :key="tag" class="text-caption px-2 py-0.5 rounded-full bg-primary/10 text-primary-600 dark:text-primary">{{ tag }}</span>
      </div>

      <div
        class="knowledge-content rounded-lg border border-ink-100 dark:border-white/10 p-6 prose-sm max-w-none"
        v-html="renderedHtml"
      />

      <KnowledgePageForm v-if="showEdit" :document="doc" @close="showEdit = false" @saved="onSaved" />
    </template>
  </div>
</template>

<style scoped>
.knowledge-content :deep(h1) { @apply text-h3 font-semibold mt-6 mb-3 first:mt-0; }
.knowledge-content :deep(h2) { @apply text-h4 font-semibold mt-5 mb-2; }
.knowledge-content :deep(h3) { @apply text-body-lg font-medium mt-4 mb-2; }
.knowledge-content :deep(p) { @apply text-body mb-3 leading-relaxed; }
.knowledge-content :deep(ul) { @apply list-disc pl-5 mb-3 space-y-1; }
.knowledge-content :deep(ol) { @apply list-decimal pl-5 mb-3 space-y-1; }
.knowledge-content :deep(code) { @apply bg-ink-50 dark:bg-white/10 px-1.5 py-0.5 rounded text-caption font-mono; }
.knowledge-content :deep(pre) { @apply bg-ink-50 dark:bg-white/10 p-3 rounded-md overflow-x-auto mb-3; }
.knowledge-content :deep(a) { @apply text-primary-600 dark:text-primary underline; }
.knowledge-content :deep(blockquote) { @apply border-l-2 border-primary/40 pl-4 italic text-ink-500 dark:text-paper-300; }
</style>
