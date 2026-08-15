<script setup lang="ts">
import type { KnowledgeDocument, KnowledgeSearchResult } from '~/shared/types/knowledge'

definePageMeta({ layout: 'default' })

const { documents, pending, error, fetchDocuments, toggleFavorite, searchDocuments } = useKnowledge()
await fetchDocuments()

const router = useRouter()
const query = ref('')
const folderFilter = ref('')
const favoritesOnly = ref(false)
const showForm = ref(false)

// Semantic search (server-side, embedding cosine similarity) is opt-in via
// Enter/the search button — it's a network round trip, unlike the instant
// substring filter below, which stays the default as-you-type behavior.
const semanticResults = ref<KnowledgeSearchResult[] | null>(null)
const searching = ref(false)

const folders = computed(() => Array.from(new Set(documents.value.map((d) => d.folder).filter(Boolean))))

const scoreById = computed(() => new Map((semanticResults.value ?? []).map((r) => [r.document.id, r.score])))

const filtered = computed(() => {
  const base = semanticResults.value ? semanticResults.value.map((r) => r.document) : documents.value
  const q = semanticResults.value ? '' : query.value.trim().toLowerCase()
  return base.filter((d) => {
    if (favoritesOnly.value && !d.favorite) return false
    if (folderFilter.value && d.folder !== folderFilter.value) return false
    if (!q) return true
    return [d.title, d.content, ...d.tags].join(' ').toLowerCase().includes(q)
  })
})

async function runSemanticSearch() {
  if (!query.value.trim()) {
    semanticResults.value = null
    return
  }
  searching.value = true
  try {
    semanticResults.value = await searchDocuments(query.value)
  } finally {
    searching.value = false
  }
}

watch(query, (value) => {
  if (!value.trim()) semanticResults.value = null
})

function onSaved(doc: KnowledgeDocument) {
  showForm.value = false
  router.push(`/knowledge/${doc.id}`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('knowledge.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('knowledge.subtitle', { count: documents.length }) }}</p>
      </div>
      <div class="tablet:ml-auto flex flex-wrap items-center gap-3">
        <div class="relative w-full tablet:w-64">
          <input
            v-model="query"
            type="text"
            :placeholder="$t('knowledge.search')"
            class="w-full px-3 py-2 pr-9 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary"
            @keyup.enter="runSemanticSearch"
          />
          <button
            type="button"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-ink-400 hover:text-primary-600 dark:hover:text-primary"
            :aria-label="$t('knowledge.semanticSearch')"
            :title="$t('knowledge.semanticSearch')"
            :disabled="searching"
            @click="runSemanticSearch"
          >
            <UiIcon name="search" :size="15" />
          </button>
        </div>
        <select v-model="folderFilter" class="px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm">
          <option value="">{{ $t('knowledge.allFolders') }}</option>
          <option v-for="f in folders" :key="f" :value="f">{{ f }}</option>
        </select>
        <label class="flex items-center gap-2 text-body-sm shrink-0">
          <input v-model="favoritesOnly" type="checkbox" class="size-4 rounded accent-primary" />
          {{ $t('knowledge.favoritesOnly') }}
        </label>
        <button
          class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="showForm = true"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('knowledge.new') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="h-28 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else>
      <p v-if="semanticResults" class="text-caption text-ink-400 flex items-center gap-2">
        <UiIcon name="search" :size="13" />
        {{ searching ? $t('knowledge.searching') : $t('knowledge.semanticResultsCount', { count: semanticResults.length }) }}
      </p>

      <div v-if="filtered.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center mt-3">
        <h2 class="text-h4 font-medium">{{ $t('knowledge.empty.title') }}</h2>
        <p class="text-body-sm text-ink-400 mt-2">{{ $t('knowledge.empty.subtitle') }}</p>
        <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="showForm = true">
          {{ $t('knowledge.empty.cta') }}
        </button>
      </div>

      <div v-else class="grid grid-cols-1 tablet:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
        <div
          v-for="d in filtered"
          :key="d.id"
          class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 space-y-2 hover:border-primary/40 transition-colors"
        >
          <div class="flex items-start justify-between gap-2">
            <NuxtLink :to="`/knowledge/${d.id}`" class="font-medium hover:text-primary-600 dark:hover:text-primary line-clamp-1">{{ d.title }}</NuxtLink>
            <button
              class="shrink-0 text-ink-400 hover:text-warning"
              :class="{ 'text-warning': d.favorite }"
              :aria-label="d.favorite ? $t('knowledge.unfavorite') : $t('knowledge.favorite')"
              :aria-pressed="d.favorite"
              @click="toggleFavorite(d)"
            >
              <UiIcon name="flag" :size="15" />
            </button>
          </div>
          <p class="text-body-sm text-ink-400 line-clamp-2">{{ d.content || '—' }}</p>
          <div class="flex items-center gap-2 flex-wrap pt-1">
            <span v-if="d.folder" class="text-caption px-2 py-0.5 rounded-full bg-ink-50 dark:bg-white/10 text-ink-500 dark:text-paper-300">{{ d.folder }}</span>
            <span v-for="tag in d.tags" :key="tag" class="text-caption px-2 py-0.5 rounded-full bg-primary/10 text-primary-600 dark:text-primary">{{ tag }}</span>
            <span v-if="scoreById.has(d.id)" class="text-caption px-2 py-0.5 rounded-full bg-info/10 text-info ml-auto">
              {{ $t('knowledge.relevance', { pct: Math.round((scoreById.get(d.id) ?? 0) * 100) }) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <KnowledgePageForm v-if="showForm" @close="showForm = false" @saved="onSaved" />
  </div>
</template>
