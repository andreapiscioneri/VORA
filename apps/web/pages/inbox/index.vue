<script setup lang="ts">
import type { Communication, CommunicationChannel } from '~/shared/types/communication'

definePageMeta({ layout: 'default' })

const { communications, pending, error, hasMore, loadingMore, fetchCommunications, loadMore, setStatus, setLabels, removeCommunication } = useCommunications()
const { contacts, fetchContacts } = useContacts()
await Promise.all([fetchCommunications(), fetchContacts()])

const { locale, t } = useI18n()
const showCompose = ref(false)
const channelFilter = ref<CommunicationChannel | 'all'>('all')
const labelFilter = ref<string | null>(null)
const suggestionTarget = ref<Communication | null>(null)
const calendarSuggestionTarget = ref<Communication | null>(null)
const aiActionsTarget = ref<Communication | null>(null)
const composePrefill = reactive<{ channel: 'email' | 'whatsapp'; contactId: string | null; subject: string; body: string; threadId: string | null }>({
  channel: 'email',
  contactId: null,
  subject: '',
  body: '',
  threadId: null,
})

function onUseAsReply(body: string) {
  const c = aiActionsTarget.value
  composePrefill.channel = c?.channel === 'whatsapp' ? 'whatsapp' : 'email'
  composePrefill.contactId = c?.contactId ?? null
  composePrefill.subject = c?.subject ? `Re: ${c.subject}` : ''
  composePrefill.body = body
  composePrefill.threadId = c ? (c.threadId ?? c.id) : null
  aiActionsTarget.value = null
  showCompose.value = true
}

function onReply(c: Communication) {
  composePrefill.channel = c.channel === 'whatsapp' ? 'whatsapp' : 'email'
  composePrefill.contactId = c.contactId
  composePrefill.subject = c.subject ? (c.subject.startsWith('Re:') ? c.subject : `Re: ${c.subject}`) : ''
  composePrefill.body = ''
  composePrefill.threadId = c.threadId ?? c.id
  showCompose.value = true
}

function onOpenCompose() {
  composePrefill.channel = 'email'
  composePrefill.contactId = null
  composePrefill.subject = ''
  composePrefill.body = ''
  composePrefill.threadId = null
  showCompose.value = true
}

// Supports the ⌘K command palette's "Send email" action (?action=compose).
const route = useRoute()
if (route.query.action === 'compose') onOpenCompose()

const filtered = computed(() => {
  let list = channelFilter.value === 'all' ? communications.value : communications.value.filter((c) => c.channel === channelFilter.value)
  if (labelFilter.value) list = list.filter((c) => c.labels.includes(labelFilter.value!))
  return list
})

const allLabels = computed(() => {
  const set = new Set<string>()
  for (const c of communications.value) for (const l of c.labels) set.add(l)
  return Array.from(set).sort()
})

// Threads: every message with the same (threadId ?? own id) groups together
// — a message with no explicit thread is simply the sole member of its own
// thread. Threads sort by their most recent message; messages within a
// thread sort oldest-first, like a real conversation.
interface Thread { key: string; messages: Communication[]; latest: Communication }

const threads = computed<Thread[]>(() => {
  const groups = new Map<string, Communication[]>()
  for (const c of filtered.value) {
    const key = c.threadId ?? c.id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }
  return Array.from(groups.entries())
    .map(([key, messages]) => {
      const sorted = [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt))
      return { key, messages: sorted, latest: sorted[sorted.length - 1] }
    })
    .sort((a, b) => b.latest.sentAt.localeCompare(a.latest.sentAt))
})

const expandedThreads = ref(new Set<string>())
function toggleThread(key: string) {
  if (expandedThreads.value.has(key)) expandedThreads.value.delete(key)
  else expandedThreads.value.add(key)
}

const addingLabelTo = ref<string | null>(null)
const newLabel = ref('')

async function onAddLabel(c: Communication) {
  const label = newLabel.value.trim()
  if (!label || c.labels.includes(label)) {
    addingLabelTo.value = null
    newLabel.value = ''
    return
  }
  await setLabels(c.id, [...c.labels, label])
  addingLabelTo.value = null
  newLabel.value = ''
}

async function onRemoveLabel(c: Communication, label: string) {
  await setLabels(c.id, c.labels.filter((l) => l !== label))
}

function contactName(contactId: string | null) {
  if (!contactId) return ''
  const c = contacts.value.find((c) => c.id === contactId)
  return c ? `${c.firstName} ${c.lastName}` : ''
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const channelIcons: Record<string, string> = { email: 'mail', whatsapp: 'message-circle', internal: 'inbox' }

async function onOpen(id: string, status: string) {
  if (status === 'unread') await setStatus(id, 'read')
}

async function onArchive(id: string) {
  await setStatus(id, 'archived')
}

async function onDelete(id: string) {
  if (!confirm(t('inbox.deleteConfirm'))) return
  await removeCommunication(id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('inbox.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('inbox.subtitle', { count: communications.length }) }}</p>
      </div>
      <div class="tablet:ml-auto flex items-center gap-3">
        <div class="flex rounded-md border border-ink-100 dark:border-white/10 overflow-hidden">
          <button
            v-for="ch in ['all', 'email', 'whatsapp', 'internal']"
            :key="ch"
            class="px-3 py-1.5 text-body-sm transition-colors"
            :class="channelFilter === ch ? 'bg-primary text-ink-950' : 'hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="channelFilter = ch as any"
          >
            {{ ch === 'all' ? $t('inbox.all') : $t(`inbox.channel.${ch}`) }}
          </button>
        </div>
        <button
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="onOpenCompose"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('inbox.new') }}
        </button>
      </div>
    </div>

    <div v-if="allLabels.length" class="flex items-center gap-2 flex-wrap">
      <span class="text-caption text-ink-400">{{ $t('inbox.labels.filterBy') }}</span>
      <button
        v-for="l in allLabels"
        :key="l"
        class="text-caption px-2 py-0.5 rounded-full transition-colors"
        :class="labelFilter === l ? 'bg-primary text-ink-950' : 'bg-ink-50 dark:bg-white/10 text-ink-500 dark:text-paper-300 hover:bg-ink-100 dark:hover:bg-white/20'"
        @click="labelFilter = labelFilter === l ? null : l"
      >
        {{ l }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="threads.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('inbox.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('inbox.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="onOpenCompose">
        {{ $t('inbox.empty.cta') }}
      </button>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="thread in threads"
        :key="thread.key"
        class="rounded-lg border transition-colors"
        :class="thread.latest.status === 'unread' ? 'border-primary/30 bg-primary/[0.03]' : 'border-ink-100 dark:border-white/10'"
      >
        <div
          class="flex items-start gap-3 p-4 cursor-pointer"
          @click="thread.messages.length > 1 ? toggleThread(thread.key) : onOpen(thread.latest.id, thread.latest.status)"
        >
          <span class="flex items-center justify-center size-9 rounded-full bg-ink-50 dark:bg-white/5 text-ink-500 dark:text-paper-300 shrink-0">
            <UiIcon :name="channelIcons[thread.latest.channel]" :size="16" />
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-body-sm font-medium truncate">{{ contactName(thread.latest.contactId) || thread.latest.subject || $t(`inbox.channel.${thread.latest.channel}`) }}</span>
              <span v-if="thread.latest.status === 'unread'" class="size-1.5 rounded-full bg-primary shrink-0" />
              <span v-if="thread.messages.length > 1" class="text-caption text-ink-400 shrink-0">{{ $t('inbox.threadCount', { count: thread.messages.length }) }}</span>
            </div>
            <p v-if="thread.latest.subject" class="text-caption text-ink-500 dark:text-paper-300 truncate">{{ thread.latest.subject }}</p>
            <p class="text-body-sm text-ink-400 truncate mt-1">{{ thread.latest.body }}</p>
            <div class="flex items-center gap-1.5 flex-wrap mt-2">
              <span
                v-for="l in thread.latest.labels"
                :key="l"
                class="inline-flex items-center gap-1 text-caption px-2 py-0.5 rounded-full bg-primary/10 text-primary-600 dark:text-primary"
              >
                {{ l }}
                <button :aria-label="$t('inbox.labels.remove', { label: l })" @click.stop="onRemoveLabel(thread.latest, l)">
                  <UiIcon name="x" :size="10" />
                </button>
              </span>
              <button
                v-if="addingLabelTo !== thread.latest.id"
                class="text-caption text-ink-400 hover:text-primary-600 dark:hover:text-primary"
                @click.stop="addingLabelTo = thread.latest.id; newLabel = ''"
              >
                {{ $t('inbox.labels.add') }}
              </button>
              <input
                v-else
                v-model="newLabel"
                type="text"
                :placeholder="$t('inbox.labels.placeholder')"
                class="text-caption px-2 py-0.5 rounded-full border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:border-primary w-28"
                @click.stop
                @keyup.enter="onAddLabel(thread.latest)"
                @keyup.esc="addingLabelTo = null"
                @blur="onAddLabel(thread.latest)"
              />
            </div>
          </div>
          <div class="flex flex-col items-end gap-2 shrink-0">
            <span class="text-caption text-ink-400">{{ formatDate(thread.latest.sentAt) }}</span>
            <div class="flex items-center gap-1">
              <button
                class="p-1.5 rounded hover:bg-ink-50 dark:hover:bg-white/5 text-ink-400"
                :aria-label="$t('inbox.reply')"
                @click.stop="onReply(thread.latest)"
              >
                <UiIcon name="arrow-left" :size="14" class="rotate-180" />
              </button>
              <button
                v-if="thread.latest.direction === 'inbound'"
                class="p-1.5 rounded hover:bg-ink-50 dark:hover:bg-white/5 text-ink-400"
                :aria-label="$t('inbox.extractTask')"
                @click.stop="suggestionTarget = thread.latest"
              >
                <UiIcon name="check-square" :size="14" />
              </button>
              <button
                v-if="thread.latest.direction === 'inbound'"
                class="p-1.5 rounded hover:bg-ink-50 dark:hover:bg-white/5 text-ink-400"
                :aria-label="$t('inbox.suggestAppointment')"
                @click.stop="calendarSuggestionTarget = thread.latest"
              >
                <UiIcon name="clock" :size="14" />
              </button>
              <button
                v-if="thread.latest.direction === 'inbound'"
                class="p-1.5 rounded hover:bg-ink-50 dark:hover:bg-white/5 text-ink-400"
                :aria-label="$t('ai.actions.title')"
                @click.stop="aiActionsTarget = thread.latest"
              >
                <UiIcon name="sparkles" :size="14" />
              </button>
              <button v-if="thread.latest.status !== 'archived'" class="p-1.5 rounded hover:bg-ink-50 dark:hover:bg-white/5 text-ink-400" :aria-label="$t('inbox.archive')" @click.stop="onArchive(thread.latest.id)">
                <UiIcon name="folder" :size="14" />
              </button>
              <button class="p-1.5 rounded hover:bg-danger/10 text-ink-400 hover:text-danger" :aria-label="$t('inbox.delete')" @click.stop="onDelete(thread.latest.id)">
                <UiIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- Earlier messages in the thread, shown when expanded -->
        <div v-if="thread.messages.length > 1 && expandedThreads.has(thread.key)" class="border-t border-ink-100 dark:border-white/10 divide-y divide-ink-100 dark:divide-white/10">
          <div v-for="m in thread.messages.slice(0, -1)" :key="m.id" class="flex items-start gap-3 p-4 pl-[4.25rem]" @click="onOpen(m.id, m.status)">
            <div class="flex-1 min-w-0">
              <span class="text-caption text-ink-400">{{ formatDate(m.sentAt) }} · {{ m.direction === 'inbound' ? contactName(m.contactId) || $t(`inbox.channel.${m.channel}`) : $t('inbox.you') }}</span>
              <p class="text-body-sm text-ink-500 dark:text-paper-300 mt-1 whitespace-pre-line">{{ m.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load-more fetches older messages by sentAt; threads already expanded
         only grow to include newly-loaded messages on the next render. -->
    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('inbox.loadingMore') : $t('inbox.loadMore') }}
      </button>
    </div>

    <InboxComposeForm
      v-if="showCompose"
      :initial-channel="composePrefill.channel"
      :initial-contact-id="composePrefill.contactId"
      :initial-subject="composePrefill.subject"
      :initial-body="composePrefill.body"
      :initial-thread-id="composePrefill.threadId"
      @close="showCompose = false"
      @sent="showCompose = false"
    />
    <InboxTaskSuggestionModal
      v-if="suggestionTarget"
      :communication="suggestionTarget"
      @close="suggestionTarget = null"
      @created="suggestionTarget = null"
    />
    <InboxCalendarSuggestionModal
      v-if="calendarSuggestionTarget"
      :communication="calendarSuggestionTarget"
      @close="calendarSuggestionTarget = null"
      @created="calendarSuggestionTarget = null"
    />
    <InboxAIActionsModal
      v-if="aiActionsTarget"
      :communication="aiActionsTarget"
      @close="aiActionsTarget = null"
      @use-as-reply="onUseAsReply"
    />
  </div>
</template>
