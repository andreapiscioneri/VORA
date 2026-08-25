<script setup lang="ts">
import type { SocialPost, SocialPostStatus } from '~/shared/types/social-post'

definePageMeta({ layout: 'default' })

const { posts, pending, error, hasMore, loadingMore, fetchPosts, loadMore } = useSocialPosts()
await fetchPosts()

const { locale } = useI18n()
const showForm = ref(false)
const editingPost = ref<SocialPost | null>(null)
const statusFilter = ref<SocialPostStatus | 'all'>('all')

const filtered = computed(() =>
  statusFilter.value === 'all' ? posts.value : posts.value.filter((p) => p.status === statusFilter.value),
)

function openNew() {
  editingPost.value = null
  showForm.value = true
}

function openEdit(post: SocialPost) {
  editingPost.value = post
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingPost.value = null
}

const statusStyles: Record<string, string> = {
  draft: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  scheduled: 'bg-info/10 text-info',
  published: 'bg-success/10 text-success',
}

const platformIcons: Record<string, string> = { instagram: 'megaphone', facebook: 'megaphone', linkedin: 'megaphone', x: 'megaphone' }
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('social.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('social.subtitle', { count: posts.length }) }}</p>
      </div>
      <div class="tablet:ml-auto flex items-center gap-3">
        <div class="flex rounded-md border border-ink-100 dark:border-white/10 overflow-hidden">
          <button
            v-for="s in ['all', 'draft', 'scheduled', 'published']"
            :key="s"
            class="px-3 py-1.5 text-body-sm transition-colors"
            :class="statusFilter === s ? 'bg-primary text-ink-950' : 'hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="statusFilter = s as any"
          >
            {{ s === 'all' ? $t('social.all') : $t(`social.status.${s}`) }}
          </button>
        </div>
        <button
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="openNew"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('social.new') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="h-32 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="filtered.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('social.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('social.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('social.empty.cta') }}
      </button>
    </div>

    <div v-else class="grid grid-cols-1 tablet:grid-cols-2 xl:grid-cols-3 gap-4">
      <button
        v-for="p in filtered"
        :key="p.id"
        class="text-left rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 space-y-3 hover:border-primary/40 transition-colors"
        @click="openEdit(p)"
      >
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-2 text-caption font-medium text-ink-500 dark:text-paper-300">
            <UiIcon :name="platformIcons[p.platform]" :size="14" />
            {{ $t(`social.platform.${p.platform}`) }}
          </span>
          <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[p.status]">{{ $t(`social.status.${p.status}`) }}</span>
        </div>
        <p class="text-body-sm line-clamp-3">{{ p.content }}</p>
        <p v-if="p.scheduledAt" class="text-caption text-ink-400">{{ new Date(p.scheduledAt).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}</p>
      </button>
    </div>

    <div v-if="!pending && !error && statusFilter === 'all' && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('social.loadingMore') : $t('social.loadMore') }}
      </button>
    </div>

    <SocialPostForm v-if="showForm" :post="editingPost" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
