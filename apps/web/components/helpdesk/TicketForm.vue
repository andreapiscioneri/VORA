<script setup lang="ts">
import type { Ticket, TicketInput } from '~/shared/types/ticket'
import { ticketInputSchema } from '~/shared/validation/ticket'

const props = defineProps<{ ticket?: Ticket | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { createTicket, updateTicket } = useTickets()
const { contacts, fetchContacts } = useContacts()
const { t } = useI18n()

if (!contacts.value.length) await fetchContacts()

const isEdit = computed(() => !!props.ticket)

const form = reactive<TicketInput>({
  title: props.ticket?.title ?? '',
  description: props.ticket?.description ?? '',
  contactId: props.ticket?.contactId ?? null,
  priority: props.ticket?.priority ?? 'medium',
  status: props.ticket?.status ?? 'open',
  category: props.ticket?.category ?? 'general',
  slaDueAt: props.ticket?.slaDueAt ?? null,
  comments: props.ticket?.comments ?? [],
  attachments: props.ticket?.attachments ?? [],
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  saveError.value = ''

  const result = ticketInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.ticket) {
      await updateTicket(props.ticket.id, result.data)
    } else {
      await createTicket(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('helpdesk.errors.save')
  } finally {
    saving.value = false
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
      aria-labelledby="ticket-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="ticket-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('helpdesk.form.editTitle') : $t('helpdesk.form.newTitle') }}
          </h2>

          <div>
            <label for="ticket-title" class="block text-label text-ink-400 mb-2">{{ $t('helpdesk.form.title') }}</label>
            <input id="ticket-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus />
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <div>
            <label for="ticket-description" class="block text-label text-ink-400 mb-2">{{ $t('helpdesk.form.description') }}</label>
            <textarea id="ticket-description" v-model="form.description" rows="3" class="vora-input resize-none" />
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="ticket-contactId" class="block text-label text-ink-400 mb-2">{{ $t('helpdesk.form.contact') }}</label>
              <select id="ticket-contactId" v-model="form.contactId" class="vora-input">
                <option :value="null">{{ $t('helpdesk.form.noContact') }}</option>
                <option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }}</option>
              </select>
            </div>
            <div>
              <label for="ticket-category" class="block text-label text-ink-400 mb-2">{{ $t('helpdesk.form.category') }}</label>
              <select id="ticket-category" v-model="form.category" class="vora-input">
                <option v-for="c in ['technical', 'billing', 'general', 'feature_request']" :key="c" :value="c">{{ $t(`helpdesk.category.${c}`) }}</option>
              </select>
            </div>
            <div>
              <label for="ticket-priority" class="block text-label text-ink-400 mb-2">{{ $t('helpdesk.form.priority') }}</label>
              <select id="ticket-priority" v-model="form.priority" class="vora-input">
                <option v-for="p in ['low', 'medium', 'high', 'urgent']" :key="p" :value="p">{{ $t(`tasks.priority.${p}`) }}</option>
              </select>
            </div>
            <div>
              <label for="ticket-status" class="block text-label text-ink-400 mb-2">{{ $t('helpdesk.form.status') }}</label>
              <select id="ticket-status" v-model="form.status" class="vora-input">
                <option v-for="s in ['open', 'in_progress', 'waiting', 'resolved', 'closed']" :key="s" :value="s">{{ $t(`helpdesk.status.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="ticket-slaDueAt" class="block text-label text-ink-400 mb-2">{{ $t('helpdesk.form.sla') }}</label>
              <input id="ticket-slaDueAt" v-model="form.slaDueAt" type="datetime-local" class="vora-input" />
            </div>
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
              {{ $t('helpdesk.form.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {{ saving ? $t('helpdesk.form.saving') : $t('helpdesk.form.save') }}
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
