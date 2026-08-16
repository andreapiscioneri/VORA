<script setup lang="ts">
import type { Appointment, AppointmentInput } from '~/shared/types/appointment'
import { appointmentInputSchema } from '~/shared/validation/appointment'

const props = defineProps<{ appointment?: Appointment | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createAppointment, updateAppointment, removeAppointment } = useAppointments()
const { contacts, fetchContacts } = useContacts()
const { opportunities, fetchOpportunities } = useOpportunities()
const { t } = useI18n()

await Promise.all([!contacts.value.length && fetchContacts(), !opportunities.value.length && fetchOpportunities()])

const isEdit = computed(() => !!props.appointment)

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nextHour() {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return toLocalInput(d.toISOString())
}

const form = reactive<AppointmentInput>({
  title: props.appointment?.title ?? '',
  contactId: props.appointment?.contactId ?? null,
  opportunityId: props.appointment?.opportunityId ?? null,
  startAt: props.appointment ? toLocalInput(props.appointment.startAt) : nextHour(),
  durationMinutes: props.appointment?.durationMinutes ?? 30,
  location: props.appointment?.location ?? '',
  videoCallUrl: props.appointment?.videoCallUrl ?? '',
  notes: props.appointment?.notes ?? '',
  status: props.appointment?.status ?? 'scheduled',
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  saveError.value = ''

  const payload = { ...form, startAt: new Date(form.startAt).toISOString() }
  const result = appointmentInputSchema.safeParse(payload)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.appointment) {
      await updateAppointment(props.appointment.id, result.data)
    } else {
      await createAppointment(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('appointments.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.appointment) return
  if (!confirm(t('appointments.deleteConfirm'))) return
  await removeAppointment(props.appointment.id)
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
      aria-labelledby="appointment-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="appointment-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('appointments.form.editTitle') : $t('appointments.form.newTitle') }}
          </h2>

          <div>
            <label for="appointment-title" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.title') }}</label>
            <input id="appointment-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus />
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="appointment-startAt" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.start') }}</label>
              <input id="appointment-startAt" v-model="form.startAt" type="datetime-local" class="vora-input" />
            </div>
            <div>
              <label for="appointment-durationMinutes" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.duration') }}</label>
              <input id="appointment-durationMinutes" v-model.number="form.durationMinutes" type="number" min="5" step="5" class="vora-input" />
            </div>
            <div>
              <label for="appointment-contactId" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.contact') }}</label>
              <select id="appointment-contactId" v-model="form.contactId" class="vora-input">
                <option :value="null">{{ $t('appointments.form.noContact') }}</option>
                <option v-for="c in contacts" :key="c.id" :value="c.id">{{ c.firstName }} {{ c.lastName }}</option>
              </select>
            </div>
            <div>
              <label for="appointment-opportunityId" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.opportunity') }}</label>
              <select id="appointment-opportunityId" v-model="form.opportunityId" class="vora-input">
                <option :value="null">{{ $t('appointments.form.noOpportunity') }}</option>
                <option v-for="o in opportunities" :key="o.id" :value="o.id">{{ o.title }}</option>
              </select>
            </div>
            <div>
              <label for="appointment-location" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.location') }}</label>
              <input id="appointment-location" v-model="form.location" type="text" class="vora-input" />
            </div>
            <div>
              <label for="appointment-status" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.status') }}</label>
              <select id="appointment-status" v-model="form.status" class="vora-input">
                <option v-for="s in ['scheduled', 'confirmed', 'completed', 'cancelled']" :key="s" :value="s">
                  {{ $t(`appointments.status.${s}`) }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label for="appointment-videoCallUrl" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.videoCallUrl') }}</label>
            <input id="appointment-videoCallUrl" v-model="form.videoCallUrl" type="url" placeholder="https://..." class="vora-input" :class="{ 'border-danger': errors.videoCallUrl }" />
            <p v-if="errors.videoCallUrl" class="text-caption text-danger mt-1">{{ errors.videoCallUrl }}</p>
          </div>

          <div>
            <label for="appointment-notes" class="block text-label text-ink-400 mb-2">{{ $t('appointments.form.notes') }}</label>
            <textarea id="appointment-notes" v-model="form.notes" rows="3" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('appointments.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('appointments.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('appointments.form.saving') : $t('appointments.form.save') }}
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
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors;
}
</style>
