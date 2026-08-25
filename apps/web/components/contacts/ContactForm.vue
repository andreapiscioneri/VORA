<script setup lang="ts">
import type { Contact, ContactInput } from '~/shared/types/contact'
import { contactInputSchema } from '~/shared/validation/contact'

const props = defineProps<{ contact?: Contact | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { createContact, updateContact } = useContacts()
const { t } = useI18n()

const isEdit = computed(() => !!props.contact)

const form = reactive<ContactInput>({
  firstName: props.contact?.firstName ?? '',
  lastName: props.contact?.lastName ?? '',
  company: props.contact?.company ?? '',
  role: props.contact?.role ?? '',
  email: props.contact?.email ?? '',
  phone: props.contact?.phone ?? '',
  whatsapp: props.contact?.whatsapp ?? '',
  website: props.contact?.website ?? '',
  address: props.contact?.address ?? '',
  notes: props.contact?.notes ?? '',
  tags: props.contact?.tags ?? [],
  status: props.contact?.status ?? 'lead',
  source: props.contact?.source ?? 'manual',
  lastContactAt: props.contact?.lastContactAt ?? null,
  nextActivityAt: props.contact?.nextActivityAt ?? null,
  attachments: props.contact?.attachments ?? [],
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = contactInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.contact) {
      await updateContact(props.contact.id, result.data)
    } else {
      await createContact(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('contacts.errors.save')
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
      aria-labelledby="contact-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div
        class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl"
      >
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="contact-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('contacts.form.editTitle') : $t('contacts.form.newTitle') }}
          </h2>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="contact-firstName" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.firstName') }}</label>
              <input id="contact-firstName" v-model="form.firstName" type="text" class="vora-input" :class="{ 'border-danger': errors.firstName }" >
              <p v-if="errors.firstName" class="text-caption text-danger mt-1">{{ errors.firstName }}</p>
            </div>
            <div>
              <label for="contact-lastName" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.lastName') }}</label>
              <input id="contact-lastName" v-model="form.lastName" type="text" class="vora-input" :class="{ 'border-danger': errors.lastName }" >
              <p v-if="errors.lastName" class="text-caption text-danger mt-1">{{ errors.lastName }}</p>
            </div>
            <div>
              <label for="contact-company" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.company') }}</label>
              <input id="contact-company" v-model="form.company" type="text" class="vora-input" >
            </div>
            <div>
              <label for="contact-role" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.role') }}</label>
              <input id="contact-role" v-model="form.role" type="text" class="vora-input" >
            </div>
            <div>
              <label for="contact-email" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.email') }}</label>
              <input id="contact-email" v-model="form.email" type="email" class="vora-input" :class="{ 'border-danger': errors.email }" >
              <p v-if="errors.email" class="text-caption text-danger mt-1">{{ errors.email }}</p>
            </div>
            <div>
              <label for="contact-phone" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.phone') }}</label>
              <input id="contact-phone" v-model="form.phone" type="tel" class="vora-input" :class="{ 'border-danger': errors.phone }" >
              <p v-if="errors.phone" class="text-caption text-danger mt-1">{{ errors.phone }}</p>
            </div>
            <div>
              <label for="contact-whatsapp" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.whatsapp') }}</label>
              <input id="contact-whatsapp" v-model="form.whatsapp" type="tel" class="vora-input" :class="{ 'border-danger': errors.whatsapp }" >
              <p v-if="errors.whatsapp" class="text-caption text-danger mt-1">{{ errors.whatsapp }}</p>
            </div>
            <div>
              <label for="contact-status" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.status') }}</label>
              <select id="contact-status" v-model="form.status" class="vora-input">
                <option value="lead">{{ $t('contacts.status.lead') }}</option>
                <option value="active">{{ $t('contacts.status.active') }}</option>
                <option value="inactive">{{ $t('contacts.status.inactive') }}</option>
              </select>
            </div>
          </div>

          <div>
            <label for="contact-notes" class="block text-label text-ink-400 mb-2">{{ $t('contacts.form.notes') }}</label>
            <textarea id="contact-notes" v-model="form.notes" rows="3" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
              {{ $t('contacts.form.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50"
            >
              {{ saving ? $t('contacts.form.saving') : $t('contacts.form.save') }}
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
