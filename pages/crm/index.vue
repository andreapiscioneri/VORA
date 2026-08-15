<script setup lang="ts">
import type { Opportunity, OpportunityStage } from '~/shared/types/opportunity'

definePageMeta({ layout: 'default' })

const { opportunities, pending, error, fetchOpportunities, setStage } = useOpportunities()
const { contacts, fetchContacts } = useContacts()
await Promise.all([fetchOpportunities(), fetchContacts()])

const { locale } = useI18n()
const showForm = ref(false)
const editingOpp = ref<Opportunity | null>(null)
const defaultStage = ref<OpportunityStage>('lead')
const dragged = ref<Opportunity | null>(null)

const columns: { stage: OpportunityStage; accent: string }[] = [
  { stage: 'lead', accent: 'bg-ink-300' },
  { stage: 'qualified', accent: 'bg-info' },
  { stage: 'proposal', accent: 'bg-warning' },
  { stage: 'negotiation', accent: 'bg-primary' },
  { stage: 'won', accent: 'bg-success' },
  { stage: 'lost', accent: 'bg-danger' },
]

const totalValue = computed(() => {
  const sum = opportunities.value.filter((o) => o.stage !== 'lost').reduce((acc, o) => acc + o.value, 0)
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(sum)
})

function oppsIn(stage: OpportunityStage) {
  return opportunities.value.filter((o) => o.stage === stage)
}

function contactName(contactId: string | null) {
  if (!contactId) return ''
  const c = contacts.value.find((c) => c.id === contactId)
  return c ? `${c.firstName} ${c.lastName}` : ''
}

function openNew(stage: OpportunityStage) {
  editingOpp.value = null
  defaultStage.value = stage
  showForm.value = true
}

function openEdit(opp: Opportunity) {
  editingOpp.value = opp
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingOpp.value = null
}

function onDragStart(opp: Opportunity, e: DragEvent) {
  dragged.value = opp
  e.dataTransfer?.setData('text/plain', opp.id)
}

async function onDrop(stage: OpportunityStage) {
  if (dragged.value && dragged.value.stage !== stage) {
    await setStage(dragged.value, stage)
  }
  dragged.value = null
}

function otherStages(stage: OpportunityStage) {
  return columns.map((col) => col.stage).filter((s) => s !== stage)
}

async function onMove(opp: Opportunity, stage: OpportunityStage) {
  await setStage(opp, stage)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('crm.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('crm.subtitle', { count: opportunities.length, value: totalValue }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew('lead')"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('crm.new') }}
      </button>
    </div>

    <div v-if="pending" class="grid grid-cols-1 tablet:grid-cols-3 xl:grid-cols-6 gap-4">
      <div v-for="i in 6" :key="i" class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="opportunities.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('crm.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('crm.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew('lead')">
        {{ $t('crm.empty.cta') }}
      </button>
    </div>

    <!-- Desktop / tablet: pipeline with horizontal scroll + drag & drop -->
    <div v-else class="hidden tablet:flex gap-4 items-start overflow-x-auto pb-2">
      <div
        v-for="col in columns"
        :key="col.stage"
        class="w-64 shrink-0 rounded-lg bg-ink-50/50 dark:bg-white/[0.03] p-3 space-y-3 min-h-[120px]"
        @dragover.prevent
        @drop="onDrop(col.stage)"
      >
        <div class="flex items-center justify-between px-1">
          <span class="flex items-center gap-2 text-body-sm font-medium">
            <span class="size-2 rounded-full" :class="col.accent" />
            {{ $t(`crm.stage.${col.stage}`) }}
          </span>
          <span class="text-caption text-ink-400">{{ oppsIn(col.stage).length }}</span>
        </div>
        <TransitionGroup name="opp-card" tag="div" class="space-y-3">
          <CrmOpportunityCard
            v-for="opp in oppsIn(col.stage)"
            :key="opp.id"
            :opportunity="opp"
            :contact-name="contactName(opp.contactId)"
            :other-stages="otherStages(opp.stage)"
            @click="openEdit(opp)"
            @dragstart="onDragStart(opp, $event)"
            @move="onMove(opp, $event)"
          />
        </TransitionGroup>
        <button
          class="w-full flex items-center justify-center gap-2 py-2 rounded-md text-body-sm text-ink-400 hover:bg-ink-100 dark:hover:bg-white/5 transition-colors"
          @click="openNew(col.stage)"
        >
          <UiIcon name="plus" :size="14" />
          {{ $t('crm.new') }}
        </button>
      </div>
    </div>

    <!-- Mobile: grouped list -->
    <div v-if="!pending && !error && opportunities.length" class="tablet:hidden space-y-6">
      <div v-for="col in columns" :key="col.stage" v-show="oppsIn(col.stage).length">
        <p class="flex items-center gap-2 text-body-sm font-medium mb-3">
          <span class="size-2 rounded-full" :class="col.accent" />
          {{ $t(`crm.stage.${col.stage}`) }}
          <span class="text-caption text-ink-400">{{ oppsIn(col.stage).length }}</span>
        </p>
        <div class="space-y-3">
          <CrmOpportunityCard
            v-for="opp in oppsIn(col.stage)"
            :key="opp.id"
            :opportunity="opp"
            :contact-name="contactName(opp.contactId)"
            :other-stages="otherStages(opp.stage)"
            @click="openEdit(opp)"
            @move="onMove(opp, $event)"
          />
        </div>
      </div>
    </div>

    <CrmOpportunityForm v-if="showForm" :opportunity="editingOpp" :default-stage="defaultStage" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>

<style scoped>
.opp-card-move,
.opp-card-enter-active,
.opp-card-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.opp-card-enter-from,
.opp-card-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.opp-card-leave-active {
  position: absolute;
}
</style>
