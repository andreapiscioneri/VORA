<script setup lang="ts">
import type { AssistantConversationSummary, AssistantMessage, AssistantToolCall } from '~/shared/types/assistant'

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const { render: renderMarkdown } = useMarkdown()

const {
  conversations,
  conversationsLoading,
  activeConversation,
  streaming,
  pendingToolCall,
  error,
  loadConversations,
  openConversation,
  startNewConversation,
  sendMessage,
  confirmToolCall,
  stopStreaming,
  renameConversation,
  setArchived,
  removeConversation,
} = useAssistant()

type View = 'list' | 'chat'
const view = ref<View>('list')
const showArchived = ref(false)
const searchQuery = ref('')
const composerText = ref('')
const openMenuId = ref<string | null>(null)
const deleteConfirmId = ref<string | null>(null)
const copiedMessageId = ref<string | null>(null)
const renamingId = ref<string | null>(null)
const renameValue = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)
let searchDebounce: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  dialogRef.value?.focus()
  await loadConversations()
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

watch(() => activeConversation.value?.messages.length, scrollToBottom)
watch(() => activeConversation.value?.messages[activeConversation.value.messages.length - 1]?.content, scrollToBottom)

async function openNewChat() {
  await startNewConversation(t('assistant.newChat'))
  view.value = 'chat'
  scrollToBottom()
}

async function openExisting(summary: AssistantConversationSummary) {
  await openConversation(summary.id)
  view.value = 'chat'
  scrollToBottom()
}

function backToList() {
  view.value = 'list'
  loadConversations({ archived: showArchived.value, query: searchQuery.value })
}

function onSearchInput() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => loadConversations({ archived: showArchived.value, query: searchQuery.value }), 300)
}

function selectTab(archived: boolean) {
  showArchived.value = archived
  loadConversations({ archived, query: searchQuery.value })
}

async function send() {
  const text = composerText.value.trim()
  if (!text || streaming.value) return
  composerText.value = ''
  await sendMessage(text)
  scrollToBottom()
}

async function regenerate(index: number) {
  if (streaming.value || !activeConversation.value) return
  const priorUser = [...activeConversation.value.messages.slice(0, index)].reverse().find((m) => m.role === 'user')
  if (!priorUser) return
  await sendMessage(priorUser.content)
  scrollToBottom()
}

async function copyMessage(message: AssistantMessage) {
  try {
    await navigator.clipboard.writeText(message.content)
    copiedMessageId.value = message.id
    setTimeout(() => {
      if (copiedMessageId.value === message.id) copiedMessageId.value = null
    }, 1500)
  } catch {
    // Clipboard API unavailable (permissions/insecure context) — silently
    // skip rather than show an error for a non-critical convenience action.
  }
}

function startRename(conv: AssistantConversationSummary) {
  renamingId.value = conv.id
  renameValue.value = conv.title
  openMenuId.value = null
}

async function commitRename(conv: AssistantConversationSummary) {
  const title = renameValue.value.trim()
  renamingId.value = null
  if (!title || title === conv.title) return
  await renameConversation(conv.id, title)
}

async function archive(conv: AssistantConversationSummary) {
  openMenuId.value = null
  await setArchived(conv.id, true)
}

async function restore(conv: AssistantConversationSummary) {
  openMenuId.value = null
  await setArchived(conv.id, false)
}

async function confirmDelete() {
  if (!deleteConfirmId.value) return
  await removeConversation(deleteConfirmId.value)
  deleteConfirmId.value = null
}

function toolCallDescription(toolCall: AssistantToolCall): string {
  const input = toolCall.input as Record<string, unknown>
  if (toolCall.name === 'create_task') return t('assistant.toolConfirm.createTask', { title: String(input.title ?? '') })
  if (toolCall.name === 'create_calendar_event') return t('assistant.toolConfirm.createEvent', { title: String(input.title ?? '') })
  return toolCall.name
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="dialogRef"
      class="fixed inset-0 z-50 flex justify-end bg-ink-950/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-panel-title"
      tabindex="-1"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:w-[440px] h-full bg-paper-50 dark:bg-ink-900 shadow-2xl flex flex-col animate-fade-up">
        <!-- Header -->
        <div class="p-4 border-b border-ink-100 dark:border-white/10 flex items-center gap-3 shrink-0">
          <button
            v-if="view === 'chat'"
            class="p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5"
            :aria-label="t('common.back')"
            @click="backToList"
          >
            <UiIcon name="arrow-left" :size="18" />
          </button>
          <UiBrandMark v-else :size="26" />

          <div class="min-w-0 flex-1">
            <h2 id="assistant-panel-title" class="text-h4 font-semibold truncate">
              {{ view === 'chat' ? activeConversation?.title || t('assistant.title') : t('assistant.title') }}
            </h2>
            <p v-if="view === 'list'" class="text-caption text-ink-400">{{ t('assistant.subtitle') }}</p>
          </div>

          <button v-if="view === 'list'" class="p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5" :aria-label="t('assistant.newChat')" @click="openNewChat">
            <UiIcon name="plus" :size="18" />
          </button>
          <button class="p-2 rounded-md hover:bg-ink-50 dark:hover:bg-white/5" :aria-label="t('assistant.close')" @click="emit('close')">
            <UiIcon name="x" :size="18" />
          </button>
        </div>

        <!-- LIST VIEW -->
        <template v-if="view === 'list'">
          <div class="p-4 border-b border-ink-100 dark:border-white/10 shrink-0">
            <div class="relative">
              <UiIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                v-model="searchQuery"
                type="search"
                :placeholder="t('assistant.searchPlaceholder')"
                class="w-full pl-9 pr-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-transparent text-body-sm focus:outline-none focus:border-primary/50"
                @input="onSearchInput"
              />
            </div>
            <div class="flex gap-2 mt-3">
              <button
                class="px-3 py-1.5 rounded-full text-caption font-medium transition-colors"
                :class="!showArchived ? 'bg-primary/10 text-primary-700 dark:text-primary' : 'text-ink-400 hover:bg-ink-50 dark:hover:bg-white/5'"
                @click="selectTab(false)"
              >
                {{ t('assistant.recent') }}
              </button>
              <button
                class="px-3 py-1.5 rounded-full text-caption font-medium transition-colors"
                :class="showArchived ? 'bg-primary/10 text-primary-700 dark:text-primary' : 'text-ink-400 hover:bg-ink-50 dark:hover:bg-white/5'"
                @click="selectTab(true)"
              >
                {{ t('assistant.archived') }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-4">
            <button
              class="w-full text-left px-4 py-3 rounded-md border border-dashed border-primary/40 hover:bg-primary/5 text-body-sm font-medium text-primary-700 dark:text-primary flex items-center gap-2"
              @click="openNewChat"
            >
              <UiIcon name="plus" :size="16" />
              {{ t('assistant.newChat') }}
            </button>

            <div v-if="conversationsLoading" class="space-y-2">
              <div v-for="i in 3" :key="i" class="h-14 rounded-md bg-ink-50 dark:bg-white/5 animate-pulse" />
            </div>

            <div v-else-if="!conversations.length" class="pt-8 text-center">
              <p class="text-body-sm text-ink-400">{{ t('assistant.noConversations') }}</p>
              <div v-if="!showArchived" class="mt-6 space-y-2">
                <p class="text-h4 font-semibold mb-3">{{ t('assistant.emptyStateTitle') }}</p>
                <button
                  v-for="key in ['organizeDay', 'priorities', 'unanswered', 'upcoming']"
                  :key="key"
                  class="w-full text-left px-4 py-3 rounded-md border border-ink-100 dark:border-white/10 hover:border-primary/40 text-body-sm transition-colors"
                  @click="openNewChat().then(() => sendMessage(t(`assistant.prompts.${key}`)))"
                >
                  {{ t(`assistant.prompts.${key}`) }}
                </button>
              </div>
            </div>

            <ul v-else class="space-y-1">
              <li v-for="conv in conversations" :key="conv.id" class="relative group">
                <input
                  v-if="renamingId === conv.id"
                  v-model="renameValue"
                  class="w-full px-4 py-3 rounded-md border border-primary/50 bg-transparent text-body-sm focus:outline-none"
                  autofocus
                  @keydown.enter="commitRename(conv)"
                  @keydown.esc="renamingId = null"
                  @blur="commitRename(conv)"
                />
                <button
                  v-else
                  class="w-full text-left px-4 py-3 rounded-md hover:bg-ink-50 dark:hover:bg-white/5 flex flex-col gap-0.5"
                  @click="openExisting(conv)"
                >
                  <span class="text-body-sm font-medium truncate pr-8">{{ conv.title }}</span>
                  <span class="text-caption text-ink-400 truncate">{{ conv.preview || t('assistant.noConversations') }}</span>
                </button>

                <div v-if="renamingId !== conv.id" class="absolute right-2 top-2">
                  <button
                    class="p-1.5 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-ink-100 dark:hover:bg-white/10 transition-opacity"
                    :aria-label="t('common.more')"
                    @click.stop="openMenuId = openMenuId === conv.id ? null : conv.id"
                  >
                    <UiIcon name="more-horizontal" :size="16" />
                  </button>

                  <div
                    v-if="openMenuId === conv.id"
                    class="absolute right-0 mt-1 w-40 rounded-md border border-ink-100 dark:border-white/10 bg-paper-50 dark:bg-ink-800 shadow-lg z-10 py-1"
                    @click.stop
                  >
                    <template v-if="!conv.archivedAt">
                      <button class="w-full text-left px-3 py-2 text-body-sm hover:bg-ink-50 dark:hover:bg-white/5 flex items-center gap-2" @click="startRename(conv)">
                        <UiIcon name="pencil" :size="14" /> {{ t('assistant.menu.rename') }}
                      </button>
                      <button class="w-full text-left px-3 py-2 text-body-sm hover:bg-ink-50 dark:hover:bg-white/5 flex items-center gap-2" @click="archive(conv)">
                        <UiIcon name="archive" :size="14" /> {{ t('assistant.menu.archive') }}
                      </button>
                    </template>
                    <button v-else class="w-full text-left px-3 py-2 text-body-sm hover:bg-ink-50 dark:hover:bg-white/5 flex items-center gap-2" @click="restore(conv)">
                      <UiIcon name="repeat" :size="14" /> {{ t('assistant.menu.restore') }}
                    </button>
                    <button
                      class="w-full text-left px-3 py-2 text-body-sm text-danger hover:bg-danger/5 flex items-center gap-2"
                      @click="deleteConfirmId = conv.id; openMenuId = null"
                    >
                      <UiIcon name="trash" :size="14" /> {{ t('assistant.menu.delete') }}
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </template>

        <!-- CHAT VIEW -->
        <template v-else>
          <div ref="messagesEl" class="flex-1 overflow-y-auto p-4 space-y-4">
            <div
              v-for="(message, index) in activeConversation?.messages ?? []"
              :key="message.id"
              class="flex flex-col"
              :class="message.role === 'user' ? 'items-end' : 'items-start'"
            >
              <div
                v-if="message.content"
                class="max-w-[85%] rounded-2xl px-4 py-2.5 text-body-sm"
                :class="message.role === 'user' ? 'bg-primary text-ink-950' : 'bg-white/70 dark:bg-white/[0.04] border border-ink-100 dark:border-white/10'"
              >
                <div v-if="message.role === 'assistant'" class="prose prose-sm dark:prose-invert max-w-none" v-html="renderMarkdown(message.content)" />
                <p v-else class="whitespace-pre-wrap">{{ message.content }}</p>
              </div>

              <div v-if="message.role === 'assistant' && message.content" class="flex items-center gap-2 mt-1 px-1">
                <button class="p-1 rounded hover:bg-ink-100 dark:hover:bg-white/10 text-ink-400" :aria-label="t('assistant.copy')" @click="copyMessage(message)">
                  <UiIcon :name="copiedMessageId === message.id ? 'check' : 'copy'" :size="13" />
                </button>
                <button
                  v-if="!streaming"
                  class="p-1 rounded hover:bg-ink-100 dark:hover:bg-white/10 text-ink-400"
                  :aria-label="t('assistant.regenerate')"
                  @click="regenerate(index)"
                >
                  <UiIcon name="repeat" :size="13" />
                </button>
              </div>
            </div>

            <div v-if="streaming && !activeConversation?.messages[activeConversation.messages.length - 1]?.content" class="flex items-center gap-2 text-caption text-ink-400 px-1">
              <span class="size-1.5 rounded-full bg-primary animate-pulse" />
              {{ t('assistant.thinking') }}
            </div>

            <div v-if="pendingToolCall" class="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p class="text-body-sm font-medium">{{ t('assistant.toolConfirm.title') }}</p>
              <p class="text-body-sm text-ink-500 dark:text-paper-300">{{ toolCallDescription(pendingToolCall) }}</p>
              <div class="flex gap-2">
                <button class="px-3 py-1.5 rounded-md border border-ink-100 dark:border-white/10 text-body-sm" @click="confirmToolCall(false)">
                  {{ t('assistant.toolConfirm.cancel') }}
                </button>
                <button class="px-3 py-1.5 rounded-md bg-primary text-ink-950 text-body-sm font-medium" @click="confirmToolCall(true)">
                  {{ t('assistant.toolConfirm.approve') }}
                </button>
              </div>
            </div>

            <p v-if="error" class="text-caption text-danger px-1">{{ t(error) }}</p>
          </div>

          <div class="p-3 border-t border-ink-100 dark:border-white/10 shrink-0">
            <div class="flex items-end gap-2 rounded-xl border border-ink-100 dark:border-white/10 bg-transparent p-2 focus-within:border-primary/50">
              <textarea
                v-model="composerText"
                rows="1"
                :placeholder="t('assistant.composerPlaceholder')"
                class="flex-1 resize-none bg-transparent text-body-sm px-2 py-1.5 focus:outline-none max-h-32"
                :disabled="streaming"
                @keydown.enter.exact.prevent="send"
              />
              <button
                v-if="streaming"
                class="p-2 rounded-full bg-ink-900 dark:bg-white text-white dark:text-ink-950 shrink-0"
                :aria-label="t('assistant.stop')"
                @click="stopStreaming"
              >
                <UiIcon name="square" :size="14" />
              </button>
              <button
                v-else
                class="p-2 rounded-full bg-primary text-ink-950 shrink-0 disabled:opacity-40"
                :disabled="!composerText.trim()"
                :aria-label="t('assistant.send')"
                @click="send"
              >
                <UiIcon name="send" :size="16" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="deleteConfirmId" class="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/50 p-4" @click.self="deleteConfirmId = null">
      <div class="w-full max-w-sm rounded-lg bg-paper-50 dark:bg-ink-800 p-5 space-y-4">
        <p class="text-h4 font-semibold">{{ t('assistant.deleteConfirm.title') }}</p>
        <p class="text-body-sm text-ink-400">{{ t('assistant.deleteConfirm.body') }}</p>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-1.5 rounded-md border border-ink-100 dark:border-white/10 text-body-sm" @click="deleteConfirmId = null">
            {{ t('assistant.deleteConfirm.cancel') }}
          </button>
          <button class="px-3 py-1.5 rounded-md bg-danger text-white text-body-sm font-medium" @click="confirmDelete">
            {{ t('assistant.deleteConfirm.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
