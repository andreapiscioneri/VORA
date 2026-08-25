<script setup lang="ts">
import type { MarketingCampaign, MarketingCampaignInput } from '~/shared/types/campaign'
import { campaignInputSchema } from '~/shared/validation/campaign'

const props = defineProps<{ campaign?: MarketingCampaign | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: []; sent: [] }>()

const { createCampaign, updateCampaign, sendCampaign, removeCampaign } = useCampaigns()
const { templates, fetchTemplates } = useEmailTemplates()
const { segments, fetchSegments, resolveSegment } = useSegments()
const { t } = useI18n()

const isEdit = computed(() => !!props.campaign)
const isSent = computed(() => props.campaign?.status === 'sent')

const form = reactive<MarketingCampaignInput>({
  name: props.campaign?.name ?? '',
  subject: props.campaign?.subject ?? '',
  body: props.campaign?.body ?? '',
  recipientCount: props.campaign?.recipientCount ?? 0,
  status: props.campaign?.status ?? 'draft',
  sentAt: props.campaign?.sentAt ?? null,
})

const selectedTemplateId = ref('')
const selectedSegmentId = ref('')
const resolvingSegment = ref(false)

fetchTemplates()
fetchSegments()

function applyTemplate() {
  const tpl = templates.value.find((t) => t.id === selectedTemplateId.value)
  if (!tpl) return
  form.subject = tpl.subject
  form.body = tpl.body
}

async function applySegment() {
  if (!selectedSegmentId.value) return
  resolvingSegment.value = true
  try {
    const result = await resolveSegment(selectedSegmentId.value)
    form.recipientCount = result.count
  } finally {
    resolvingSegment.value = false
  }
}

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const sending = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = campaignInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.campaign) {
      await updateCampaign(props.campaign.id, result.data)
    } else {
      await createCampaign(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('campaigns.errors.save')
  } finally {
    saving.value = false
  }
}

async function onSend() {
  if (!props.campaign) return
  sending.value = true
  try {
    await sendCampaign(props.campaign.id)
    emit('sent')
  } catch {
    saveError.value = t('campaigns.errors.send')
  } finally {
    sending.value = false
  }
}

async function onDelete() {
  if (!props.campaign) return
  if (!confirm(t('campaigns.deleteConfirm'))) return
  await removeCampaign(props.campaign.id)
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
      aria-labelledby="campaign-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="campaign-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('campaigns.form.editTitle') : $t('campaigns.form.newTitle') }}
          </h2>

          <div v-if="!isSent" class="rounded-md border border-warning/30 bg-warning/5 p-3 text-caption text-warning flex items-start gap-2">
            <UiIcon name="alert-triangle" :size="14" class="mt-0.5 shrink-0" />
            <span>{{ $t('campaigns.mockNotice') }}</span>
          </div>
          <div v-else class="rounded-md border border-success/30 bg-success/5 p-3 text-caption text-success">
            {{ $t('campaigns.sentOn') }} {{ new Date(campaign!.sentAt!).toLocaleString() }}
          </div>

          <div v-if="!isEdit">
            <label for="campaign-template" class="block text-label text-ink-400 mb-2">{{ $t('campaigns.form.useTemplate') }}</label>
            <select id="campaign-template" v-model="selectedTemplateId" class="vora-input" @change="applyTemplate">
              <option value="">{{ $t('campaigns.form.noTemplate') }}</option>
              <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
            </select>
          </div>

          <div>
            <label for="campaign-name" class="block text-label text-ink-400 mb-2">{{ $t('campaigns.form.name') }}</label>
            <input id="campaign-name" v-model="form.name" type="text" :disabled="isSent" class="vora-input" :class="{ 'border-danger': errors.name }" autofocus >
            <p v-if="errors.name" class="text-caption text-danger mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label for="campaign-subject" class="block text-label text-ink-400 mb-2">{{ $t('campaigns.form.subject') }}</label>
            <input id="campaign-subject" v-model="form.subject" type="text" :disabled="isSent" class="vora-input" :class="{ 'border-danger': errors.subject }" >
            <p v-if="errors.subject" class="text-caption text-danger mt-1">{{ errors.subject }}</p>
          </div>

          <div>
            <label for="campaign-body" class="block text-label text-ink-400 mb-2">{{ $t('campaigns.form.body') }}</label>
            <textarea id="campaign-body" v-model="form.body" rows="5" :disabled="isSent" class="vora-input resize-none" />
          </div>

          <div v-if="!isSent">
            <label for="campaign-segment" class="block text-label text-ink-400 mb-2">{{ $t('campaigns.form.useSegment') }}</label>
            <select id="campaign-segment" v-model="selectedSegmentId" class="vora-input" @change="applySegment">
              <option value="">{{ $t('campaigns.form.noSegment') }}</option>
              <option v-for="s in segments" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <p v-if="resolvingSegment" class="text-caption text-ink-400 mt-1">{{ $t('campaigns.form.resolvingSegment') }}</p>
          </div>

          <div>
            <label for="campaign-recipientCount" class="block text-label text-ink-400 mb-2">{{ $t('campaigns.form.recipientCount') }}</label>
            <input id="campaign-recipientCount" v-model.number="form.recipientCount" type="number" min="0" :disabled="isSent" class="vora-input" >
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit && !isSent" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('campaigns.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('campaigns.form.cancel') }}
              </button>
              <button
                v-if="!isSent"
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('campaigns.form.saving') : $t('campaigns.form.save') }}
              </button>
              <button
                v-if="isEdit && !isSent"
                type="button"
                :disabled="sending"
                class="flex items-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
                @click="onSend"
              >
                <UiIcon name="send" :size="14" />
                {{ $t('campaigns.send') }}
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
