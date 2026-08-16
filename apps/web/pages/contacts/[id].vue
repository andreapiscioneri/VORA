<script setup lang="ts">
import type { Contact } from '~/shared/types/contact'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { removeContact, addAttachment } = useContacts()

const { data: contact, error, pending, refresh } = await useFetch<Contact>(`/api/contacts/${route.params.id}`)

const showForm = ref(false)
const showAIRelationship = ref(false)
const composePrefill = reactive<{ contactId: string | null; body: string }>({ contactId: null, body: '' })
const showCompose = ref(false)

const newAttachmentTitle = ref('')
const newAttachmentUrl = ref('')
const addingAttachment = ref(false)
const attachmentError = ref('')

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function onAddAttachment() {
  attachmentError.value = ''
  if (!newAttachmentTitle.value.trim() || !newAttachmentUrl.value.trim() || !contact.value) return
  addingAttachment.value = true
  try {
    await addAttachment(contact.value.id, newAttachmentTitle.value.trim(), newAttachmentUrl.value.trim())
    newAttachmentTitle.value = ''
    newAttachmentUrl.value = ''
    await refresh()
  } catch {
    attachmentError.value = t('contacts.attachments.error')
  } finally {
    addingAttachment.value = false
  }
}

function onUseAsFollowUp(body: string) {
  composePrefill.contactId = contact.value?.id ?? null
  composePrefill.body = body
  showAIRelationship.value = false
  showCompose.value = true
}

async function onSaved() {
  showForm.value = false
  await refresh()
}

async function onDelete() {
  if (!contact.value) return
  if (!confirm($t('contacts.detail.deleteConfirm'))) return
  await removeContact(contact.value.id)
  await router.push('/contacts')
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <NuxtLink to="/contacts" class="inline-flex items-center gap-2 text-body-sm text-ink-400 hover:text-ink-900 dark:hover:text-white">
      <UiIcon name="arrow-left" :size="16" />
      {{ $t('contacts.detail.back') }}
    </NuxtLink>

    <div v-if="pending" class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />

    <div v-else-if="error || !contact" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t('contacts.detail.notFound') }}
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-h1 font-semibold tracking-tight">{{ contact.firstName }} {{ contact.lastName }}</h1>
          <p class="text-body text-ink-400 mt-1">{{ contact.role }}{{ contact.role && contact.company ? ' · ' : '' }}{{ contact.company }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button class="flex items-center gap-2 px-4 py-2 rounded-md text-body-sm border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5" @click="showAIRelationship = true">
            <UiIcon name="sparkles" :size="16" />
            {{ $t('ai.relationship.title') }}
          </button>
          <button class="flex items-center gap-2 px-4 py-2 rounded-md text-body-sm border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5" @click="showForm = true">
            <UiIcon name="pencil" :size="16" />
            {{ $t('contacts.detail.edit') }}
          </button>
          <button class="flex items-center gap-2 px-4 py-2 rounded-md text-body-sm text-danger border border-danger/30 hover:bg-danger/5" @click="onDelete">
            <UiIcon name="trash" :size="16" />
            {{ $t('contacts.detail.delete') }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        <div class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-3">
          <div>
            <p class="text-label text-ink-400">{{ $t('contacts.form.email') }}</p>
            <p class="text-body">{{ contact.email || '—' }}</p>
          </div>
          <div>
            <p class="text-label text-ink-400">{{ $t('contacts.form.phone') }}</p>
            <p class="text-body">{{ contact.phone || '—' }}</p>
          </div>
          <div>
            <p class="text-label text-ink-400">{{ $t('contacts.form.whatsapp') }}</p>
            <p class="text-body">{{ contact.whatsapp || '—' }}</p>
          </div>
        </div>
        <div class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-3">
          <div>
            <p class="text-label text-ink-400">{{ $t('contacts.form.status') }}</p>
            <p class="text-body">{{ $t(`contacts.status.${contact.status}`) }}</p>
          </div>
          <div>
            <p class="text-label text-ink-400">{{ $t('contacts.form.notes') }}</p>
            <p class="text-body whitespace-pre-line">{{ contact.notes || '—' }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-4">
        <h2 class="text-h4 font-medium">{{ $t('contacts.attachments.title') }}</h2>
        <p v-if="contact.attachments.length === 0" class="text-body-sm text-ink-400">{{ $t('contacts.attachments.empty') }}</p>
        <ul v-else class="space-y-2">
          <li v-for="a in contact.attachments" :key="a.id" class="flex items-center justify-between gap-3 rounded-lg border border-ink-100 dark:border-white/10 p-3">
            <a :href="a.url" target="_blank" rel="noopener noreferrer" class="text-body-sm font-medium text-primary-600 dark:text-primary hover:underline truncate">
              {{ a.title }}
            </a>
            <span class="text-caption text-ink-400 shrink-0">{{ formatDate(a.addedAt) }}</span>
          </li>
        </ul>

        <form class="flex flex-col tablet:flex-row items-start gap-2" @submit.prevent="onAddAttachment">
          <input
            id="contact-attachment-title"
            v-model="newAttachmentTitle"
            type="text"
            :placeholder="$t('contacts.attachments.titleLabel')"
            class="flex-1 w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary transition-colors"
          />
          <input
            id="contact-attachment-url"
            v-model="newAttachmentUrl"
            type="url"
            :placeholder="$t('contacts.attachments.urlLabel')"
            class="flex-1 w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            :disabled="addingAttachment || !newAttachmentTitle.trim() || !newAttachmentUrl.trim()"
            class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {{ $t('contacts.attachments.add') }}
          </button>
        </form>
        <p v-if="attachmentError" class="text-caption text-danger">{{ attachmentError }}</p>
      </div>

      <ContactsContactForm v-if="showForm" :contact="contact" @close="showForm = false" @saved="onSaved" />
      <ContactsAIRelationshipModal
        v-if="showAIRelationship"
        :contact="contact"
        @close="showAIRelationship = false"
        @use-as-follow-up="onUseAsFollowUp"
      />
      <InboxComposeForm
        v-if="showCompose"
        initial-channel="email"
        :initial-contact-id="composePrefill.contactId"
        :initial-body="composePrefill.body"
        @close="showCompose = false"
        @sent="showCompose = false"
      />
    </template>
  </div>
</template>
