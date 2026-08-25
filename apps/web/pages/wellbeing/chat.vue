<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { messages, pending, streaming, error, fetchHistory, sendMessage } = useWellbeingChat()
await fetchHistory()

const input = ref('')
const scrollRef = ref<HTMLElement | null>(null)

async function submit() {
  const content = input.value.trim()
  if (!content || streaming.value) return
  input.value = ''
  await sendMessage(content)
}

watch(
  () => messages.value.map((m) => m.content).join(),
  async () => {
    await nextTick()
    scrollRef.value?.scrollTo({ top: scrollRef.value.scrollHeight, behavior: 'smooth' })
  }
)
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-8rem)]">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('wellbeing.chat.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('wellbeing.chat.subtitle') }}</p>
      </div>
      <NuxtLink to="/wellbeing" class="text-body-sm text-primary hover:underline">{{ $t('wellbeing.chat.backToCheckin') }}</NuxtLink>
    </div>

    <div class="rounded-lg border border-primary/20 bg-primary/5 p-4 text-body-sm text-ink-500 dark:text-ink-300 mb-4">
      {{ $t('wellbeing.disclaimer') }}
    </div>

    <div v-if="pending" class="flex-1 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />

    <template v-else>
      <div ref="scrollRef" class="flex-1 overflow-y-auto rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5 space-y-4">
        <div v-if="!messages.length" class="h-full flex flex-col items-center justify-center text-center gap-2 text-ink-400">
          <UiIcon name="message-circle" :size="28" class="text-primary" />
          <p class="text-body-sm">{{ $t('wellbeing.chat.empty') }}</p>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[75%] rounded-lg px-4 py-2 text-body-sm whitespace-pre-wrap"
            :class="
              message.role === 'user'
                ? 'bg-primary text-ink-950'
                : 'bg-ink-50 dark:bg-white/10 text-ink-700 dark:text-ink-200'
            "
          >
            {{ message.content || '…' }}
          </div>
        </div>
      </div>

      <p v-if="error" class="text-body-sm text-danger mt-2">{{ $t(error) }}</p>

      <form class="flex items-center gap-2 mt-4" @submit.prevent="submit">
        <input
          v-model="input"
          type="text"
          class="flex-1 rounded-md border border-ink-100 dark:border-white/10 bg-transparent px-3 py-2 text-body-sm"
          :placeholder="$t('wellbeing.chat.placeholder')"
          :disabled="streaming"
          :aria-label="$t('wellbeing.chat.placeholder')"
        >
        <button
          type="submit"
          class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          :disabled="streaming || !input.trim()"
        >
          <UiIcon name="send" :size="16" />
          {{ streaming ? $t('wellbeing.chat.sending') : $t('wellbeing.chat.send') }}
        </button>
      </form>
    </template>
  </div>
</template>
