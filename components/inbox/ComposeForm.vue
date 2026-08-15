<script setup lang="ts">
const props = defineProps<{
  initialChannel?: 'email' | 'whatsapp'
  initialContactId?: string | null
  initialSubject?: string
  initialBody?: string
  initialThreadId?: string | null
}>()
const emit = defineEmits<{ close: []; sent: [] }>()

const { sendMessage } = useCommunications()
const { contacts, fetchContacts } = useContacts()
const { t } = useI18n()

if (!contacts.value.length) await fetchContacts()

const form = reactive({
  channel: props.initialChannel ?? ('email' as 'email' | 'whatsapp'),
  contactId: props.initialContactId ?? (null as string | null),
  to: '',
  subject: props.initialSubject ?? '',
  body: props.initialBody ?? '',
})

if (form.contactId) {
  const c = contacts.value.find((c) => c.id === form.contactId)
  if (c) form.to = form.channel === 'email' ? c.email : c.whatsapp || c.phone
}

watch(
  () => form.contactId,
  (id) => {
    const c = contacts.value.find((c) => c.id === id)
    if (!c) return
    form.to = form.channel === 'email' ? c.email : c.whatsapp || c.phone
  },
)

const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const sendError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  sendError.value = ''

  if (!form.to.trim()) {
    errors.to = t('validation.required')
    return
  }
  if (!form.body.trim()) {
    errors.body = t('validation.required')
    return
  }

  sending.value = true
  try {
    await sendMessage({ channel: form.channel, to: form.to, contactId: form.contactId, subject: form.subject, body: form.body, threadId: props.initialThreadId ?? null })
    emit('sent')
  } catch {
    sendError.value = t('inbox.errors.send')
  } finally {
    sending.value = false
  }
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
      aria-labelledby="compose-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="compose-form-title" class="text-h3 font-semibold">{{ $t('inbox.form.newTitle') }}</h2>

          <div class="rounded-md border border-warning/30 bg-warning/5 p-3 text-caption text-warning flex items-start gap-2">
            <UiIcon name="alert-triangle" :size="14" class="mt-0.5 shrink-0" />
            <span>{{ $t('inbox.mockNotice') }}</span>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="compose-channel" class="block text-label text-ink-400 mb-2">{{ $t('inbox.form.channel') }}</label>
              <select id="compose-channel" v-model="form.channel" class="vora-input">
                <option value="email">{{ $t('inbox.channel.email') }}</option>
                <option value="whatsapp">{{ $t('inbox.channel.whatsapp') }}</option>
              </select>
            </div>
            <div>
              <label for="compose-contactId" class="block text-label text-ink-400 mb-2">{{ $t('inbox.form.contact') }}</label>
              <select id="compose-contactId" v-model="form.contactId" class="vora-input">
                <option :value="null">{{ $t('inbox.form.noContact') }}</option>
                <option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }}</option>
              </select>
            </div>
          </div>

          <div>
            <label for="compose-to" class="block text-label text-ink-400 mb-2">{{ $t('inbox.form.to') }}</label>
            <input id="compose-to" v-model="form.to" type="text" class="vora-input" :class="{ 'border-danger': errors.to }" />
            <p v-if="errors.to" class="text-caption text-danger mt-1">{{ errors.to }}</p>
          </div>

          <div v-if="form.channel === 'email'">
            <label for="compose-subject" class="block text-label text-ink-400 mb-2">{{ $t('inbox.form.subject') }}</label>
            <input id="compose-subject" v-model="form.subject" type="text" class="vora-input" />
          </div>

          <div>
            <label for="compose-body" class="block text-label text-ink-400 mb-2">{{ $t('inbox.form.body') }}</label>
            <textarea id="compose-body" v-model="form.body" rows="4" class="vora-input resize-none" :class="{ 'border-danger': errors.body }" />
            <p v-if="errors.body" class="text-caption text-danger mt-1">{{ errors.body }}</p>
          </div>

          <p v-if="sendError" class="text-body-sm text-danger">{{ sendError }}</p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
              {{ $t('inbox.form.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="sending"
              class="flex items-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              <UiIcon name="send" :size="14" />
              {{ sending ? $t('inbox.form.sending') : $t('inbox.form.send') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.vora-input {
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors;
}
</style>
