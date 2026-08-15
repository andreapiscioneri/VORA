<script setup lang="ts">
import type { Contact } from '~/shared/types/contact'

definePageMeta({ layout: 'default' })

const { contacts, pending, error, fetchContacts, removeContact } = useContacts()
await fetchContacts()

const query = ref('')
const showForm = ref(false)
const editingContact = ref<Contact | null>(null)

// Supports the ⌘K command palette's "New contact" action, which navigates
// here with ?action=new instead of duplicating the create form elsewhere.
const route = useRoute()
if (route.query.action === 'new') showForm.value = true

// Supports the ⌘K command palette's "Search contact" action (?action=search)
// — focuses this page's own search field rather than duplicating search UI.
const searchInputRef = ref<HTMLInputElement | null>(null)
onMounted(() => {
  if (route.query.action === 'search') searchInputRef.value?.focus()
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return contacts.value
  return contacts.value.filter((c) =>
    [c.firstName, c.lastName, c.company, c.email].join(' ').toLowerCase().includes(q),
  )
})

function openNew() {
  editingContact.value = null
  showForm.value = true
}

function openEdit(contact: Contact) {
  editingContact.value = contact
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingContact.value = null
}

async function onSaved() {
  closeForm()
}

async function onDelete(contact: Contact) {
  if (!confirm($t('contacts.detail.deleteConfirm'))) return
  await removeContact(contact.id)
}

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success',
  lead: 'bg-primary/15 text-primary-600 dark:text-primary',
  inactive: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('contacts.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('contacts.subtitle', { count: contacts.length }) }}</p>
      </div>
      <div class="tablet:ml-auto flex items-center gap-3">
        <input
          ref="searchInputRef"
          v-model="query"
          type="text"
          :placeholder="$t('contacts.search')"
          class="w-full tablet:w-64 px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body-sm outline-none focus:border-primary"
        />
        <button
          class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover"
          @click="openNew"
        >
          {{ $t('contacts.new') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="filtered.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('contacts.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('contacts.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover" @click="openNew">
        {{ $t('contacts.empty.cta') }}
      </button>
    </div>

    <!-- Desktop / tablet: table -->
    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('contacts.columns.name') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('contacts.columns.company') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('contacts.columns.email') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('contacts.columns.status') }}</th>
            <th class="w-20" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in filtered"
            :key="c.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5"
          >
            <td class="px-4 py-3">
              <NuxtLink :to="`/contacts/${c.id}`" class="font-medium hover:text-primary-600">
                {{ c.firstName }} {{ c.lastName }}
              </NuxtLink>
            </td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ c.company || '—' }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ c.email || '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[c.status]">
                {{ $t(`contacts.status.${c.status}`) }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="text-ink-400 hover:text-ink-900 dark:hover:text-white mr-2 p-1" :aria-label="$t('contacts.detail.edit')" @click="openEdit(c)">
                <UiIcon name="pencil" :size="16" />
              </button>
              <button class="text-ink-400 hover:text-danger p-1" :aria-label="$t('contacts.detail.delete')" @click="onDelete(c)">
                <UiIcon name="trash" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: cards -->
    <div v-if="!pending && !error && filtered.length" class="tablet:hidden space-y-3">
      <div
        v-for="c in filtered"
        :key="c.id"
        class="rounded-lg border border-ink-100 dark:border-white/10 p-4 flex items-start gap-3"
      >
        <div class="flex-1 min-w-0">
          <NuxtLink :to="`/contacts/${c.id}`" class="font-medium">{{ c.firstName }} {{ c.lastName }}</NuxtLink>
          <p class="text-body-sm text-ink-400 truncate">{{ c.company || c.email || '—' }}</p>
          <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[c.status]">
            {{ $t(`contacts.status.${c.status}`) }}
          </span>
        </div>
        <button class="text-ink-400 hover:text-ink-900 dark:hover:text-white p-2" :aria-label="$t('contacts.detail.edit')" @click="openEdit(c)">
          <UiIcon name="pencil" :size="16" />
        </button>
      </div>
    </div>

    <ContactsContactForm v-if="showForm" :contact="editingContact" @close="closeForm" @saved="onSaved" />
  </div>
</template>
