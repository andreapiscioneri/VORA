<script setup lang="ts">
import type { MarketingCampaign } from '~/shared/types/campaign'

definePageMeta({ layout: 'default' })

const { campaigns, pending, error, fetchCampaigns } = useCampaigns()
await fetchCampaigns()

const showForm = ref(false)
const editingCampaign = ref<MarketingCampaign | null>(null)

function openNew() {
  editingCampaign.value = null
  showForm.value = true
}

function openEdit(campaign: MarketingCampaign) {
  editingCampaign.value = campaign
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingCampaign.value = null
}

const statusStyles: Record<string, string> = {
  draft: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  sent: 'bg-success/10 text-success',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('campaigns.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('campaigns.subtitle', { count: campaigns.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('campaigns.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="campaigns.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('campaigns.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('campaigns.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('campaigns.empty.cta') }}
      </button>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="c in campaigns"
        :key="c.id"
        class="w-full text-left flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-4 hover:border-primary/40 transition-colors"
        @click="openEdit(c)"
      >
        <div class="flex-1 min-w-0">
          <p class="text-body-sm font-medium truncate">{{ c.name }}</p>
          <p class="text-caption text-ink-400 truncate">{{ c.subject }} · {{ c.recipientCount }} destinatari</p>
        </div>
        <span class="px-2 py-1 rounded-full text-caption font-medium shrink-0" :class="statusStyles[c.status]">{{ $t(`campaigns.status.${c.status}`) }}</span>
      </button>
    </div>

    <CampaignsCampaignForm v-if="showForm" :campaign="editingCampaign" @close="closeForm" @saved="closeForm" @deleted="closeForm" @sent="closeForm" />
  </div>
</template>
