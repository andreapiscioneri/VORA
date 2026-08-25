<script setup lang="ts">
import type { EmailTemplate } from '~/shared/types/emailTemplate'

definePageMeta({ layout: 'default' })

const { templates, pending, error, hasMore, loadingMore, fetchTemplates, loadMore } = useEmailTemplates()
await fetchTemplates()

const showForm = ref(false)
const editingTemplate = ref<EmailTemplate | null>(null)

function openNew() {
  editingTemplate.value = null
  showForm.value = true
}

function openEdit(template: EmailTemplate) {
  editingTemplate.value = template
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTemplate.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('templates.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('templates.subtitle', { count: templates.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('templates.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="templates.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('templates.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('templates.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('templates.empty.cta') }}
      </button>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="tpl in templates"
        :key="tpl.id"
        class="w-full text-left flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-4 hover:border-primary/40 transition-colors"
        @click="openEdit(tpl)"
      >
        <div class="flex-1 min-w-0">
          <p class="text-body-sm font-medium truncate">{{ tpl.name }}</p>
          <p class="text-caption text-ink-400 truncate">{{ tpl.subject }}</p>
        </div>
      </button>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('templates.loadingMore') : $t('templates.loadMore') }}
      </button>
    </div>

    <MarketingEmailTemplateForm v-if="showForm" :template="editingTemplate" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
