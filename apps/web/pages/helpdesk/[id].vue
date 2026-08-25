<script setup lang="ts">
import type { Ticket } from '~/shared/types/ticket'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { addComment, removeTicket, addAttachment } = useTickets()
const { contacts, fetchContacts } = useContacts()
await fetchContacts()

const { data: ticket, pending, error, refresh } = await useFetch<Ticket>(`/api/tickets/${route.params.id}`)

const showEdit = ref(false)
const newComment = ref('')
const sending = ref(false)

const newAttachmentTitle = ref('')
const newAttachmentUrl = ref('')
const addingAttachment = ref(false)
const attachmentError = ref('')

async function onAddAttachment() {
  attachmentError.value = ''
  if (!newAttachmentTitle.value.trim() || !newAttachmentUrl.value.trim() || !ticket.value) return
  addingAttachment.value = true
  try {
    await addAttachment(ticket.value.id, newAttachmentTitle.value.trim(), newAttachmentUrl.value.trim())
    newAttachmentTitle.value = ''
    newAttachmentUrl.value = ''
    await refresh()
  } catch {
    attachmentError.value = t('helpdesk.attachments.error')
  } finally {
    addingAttachment.value = false
  }
}

function contactName(contactId: string | null) {
  if (!contactId) return ''
  const c = contacts.value.find((c) => c.id === contactId)
  return c ? `${c.firstName} ${c.lastName}` : ''
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function onDelete() {
  if (!ticket.value) return
  if (!confirm(t('helpdesk.detail.deleteConfirm'))) return
  await removeTicket(ticket.value.id)
  router.push('/helpdesk')
}

async function onAddComment() {
  if (!newComment.value.trim() || !ticket.value) return
  sending.value = true
  try {
    await addComment(ticket.value, newComment.value.trim())
    newComment.value = ''
    await refresh()
  } finally {
    sending.value = false
  }
}

const statusStyles: Record<string, string> = {
  open: 'bg-info/10 text-info',
  in_progress: 'bg-warning/10 text-warning',
  waiting: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
}

function slaStyle(slaDueAt: string | null) {
  if (!slaDueAt) return ''
  const diff = new Date(slaDueAt).getTime() - Date.now()
  if (diff < 0) return 'text-danger'
  if (diff < 1000 * 60 * 60 * 4) return 'text-warning'
  return 'text-ink-400'
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <NuxtLink to="/helpdesk" class="inline-flex items-center gap-2 text-body-sm text-ink-400 hover:text-ink-900 dark:hover:text-white">
      <UiIcon name="arrow-left" :size="16" />
      {{ $t('helpdesk.detail.back') }}
    </NuxtLink>

    <div v-if="pending" class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    <div v-else-if="error || !ticket" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t('helpdesk.errors.load') }}
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-h1 font-semibold tracking-tight">{{ ticket.title }}</h1>
          <p class="text-body text-ink-400 mt-1">{{ contactName(ticket.contactId) || '—' }} · {{ $t(`helpdesk.category.${ticket.category}`) }}</p>
        </div>
        <span class="px-3 py-1.5 rounded-full text-caption font-medium shrink-0" :class="statusStyles[ticket.status]">
          {{ $t(`helpdesk.status.${ticket.status}`) }}
        </span>
      </div>

      <p v-if="ticket.slaDueAt" class="flex items-center gap-2 text-body-sm" :class="slaStyle(ticket.slaDueAt)">
        <UiIcon name="clock" :size="14" />
        {{ $t('helpdesk.sla.dueAt', { date: formatDate(ticket.slaDueAt) }) }}
        <span v-if="new Date(ticket.slaDueAt).getTime() < Date.now()" class="text-caption font-medium">({{ $t('helpdesk.sla.overdue') }})</span>
      </p>

      <p v-if="ticket.description" class="text-body whitespace-pre-line rounded-lg border border-ink-100 dark:border-white/10 p-4">
        {{ ticket.description }}
      </p>

      <div class="flex items-center gap-4">
        <button class="text-body-sm text-ink-400 hover:text-ink-900 dark:hover:text-white" @click="showEdit = true">
          {{ $t('helpdesk.form.editTitle') }}
        </button>
        <button class="flex items-center gap-2 px-3 py-1.5 rounded-md text-body-sm text-danger border border-danger/30 hover:bg-danger/5" @click="onDelete">
          <UiIcon name="trash" :size="14" />
          {{ $t('helpdesk.detail.delete') }}
        </button>
      </div>

      <div class="space-y-4">
        <h2 class="text-h4 font-medium">{{ $t('helpdesk.detail.comments') }}</h2>
        <p v-if="ticket.comments.length === 0" class="text-body-sm text-ink-400">{{ $t('helpdesk.detail.noComments') }}</p>
        <div v-else class="space-y-3">
          <div v-for="c in ticket.comments" :key="c.id" class="rounded-lg border border-ink-100 dark:border-white/10 p-4">
            <p class="text-body-sm whitespace-pre-line">{{ c.body }}</p>
            <p class="text-caption text-ink-400 mt-2">{{ formatDate(c.createdAt) }}</p>
          </div>
        </div>

        <form class="flex items-start gap-3" @submit.prevent="onAddComment">
          <textarea
            v-model="newComment"
            rows="2"
            :placeholder="$t('helpdesk.detail.addComment')"
            class="flex-1 px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary resize-none transition-colors"
          />
          <button
            type="submit"
            :disabled="sending || !newComment.trim()"
            class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {{ $t('helpdesk.detail.send') }}
          </button>
        </form>
      </div>

      <div class="space-y-4">
        <h2 class="text-h4 font-medium">{{ $t('helpdesk.attachments.title') }}</h2>
        <p v-if="ticket.attachments.length === 0" class="text-body-sm text-ink-400">{{ $t('helpdesk.attachments.empty') }}</p>
        <ul v-else class="space-y-2">
          <li v-for="a in ticket.attachments" :key="a.id" class="flex items-center justify-between gap-3 rounded-lg border border-ink-100 dark:border-white/10 p-3">
            <a :href="a.url" target="_blank" rel="noopener noreferrer" class="text-body-sm font-medium text-primary-600 dark:text-primary hover:underline truncate">
              {{ a.title }}
            </a>
            <span class="text-caption text-ink-400 shrink-0">{{ formatDate(a.addedAt) }}</span>
          </li>
        </ul>

        <form class="flex flex-col tablet:flex-row items-start gap-2" @submit.prevent="onAddAttachment">
          <input
            id="ticket-attachment-title"
            v-model="newAttachmentTitle"
            type="text"
            :placeholder="$t('helpdesk.attachments.titleLabel')"
            class="flex-1 w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary transition-colors"
          >
          <input
            id="ticket-attachment-url"
            v-model="newAttachmentUrl"
            type="url"
            :placeholder="$t('helpdesk.attachments.urlLabel')"
            class="flex-1 w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary transition-colors"
          >
          <button
            type="submit"
            :disabled="addingAttachment || !newAttachmentTitle.trim() || !newAttachmentUrl.trim()"
            class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {{ $t('helpdesk.attachments.add') }}
          </button>
        </form>
        <p v-if="attachmentError" class="text-caption text-danger">{{ attachmentError }}</p>
      </div>

      <HelpdeskTicketForm v-if="showEdit" :ticket="ticket" @close="showEdit = false" @saved="showEdit = false; refresh()" />
    </template>
  </div>
</template>
