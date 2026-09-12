<script setup lang="ts">
import type { WelfareInitiative, WelfareInitiativeInput } from '~/shared/types/welfare'
import { welfareInitiativeInputSchema } from '~/shared/validation/welfare'
import { WELFARE_CATEGORIES, WELFARE_STATUSES } from '~/shared/types/welfare'

const props = defineProps<{ initiative?: WelfareInitiative | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createInitiative, updateInitiative, removeInitiative } = useWelfare()
const { t } = useI18n()

const isEdit = computed(() => !!props.initiative)

const form = reactive<WelfareInitiativeInput>({
  title: props.initiative?.title ?? '',
  description: props.initiative?.description ?? '',
  category: props.initiative?.category ?? 'other',
  status: props.initiative?.status ?? 'active',
  enrolledCount: props.initiative?.enrolledCount ?? 0,
  startDate: props.initiative?.startDate ?? null,
  endDate: props.initiative?.endDate ?? null,
  notes: props.initiative?.notes ?? '',
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = welfareInitiativeInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.initiative) {
      await updateInitiative(props.initiative.id, result.data)
    } else {
      await createInitiative(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('welfare.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.initiative) return
  if (!confirm(t('welfare.deleteConfirm'))) return
  await removeInitiative(props.initiative.id)
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
      aria-labelledby="welfare-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="welfare-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('welfare.form.editTitle') : $t('welfare.form.newTitle') }}
          </h2>

          <div>
            <label for="welfare-title" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.title') }}</label>
            <input id="welfare-title" v-model="form.title" type="text" class="vora-input" :class="{ 'border-danger': errors.title }" autofocus >
            <p v-if="errors.title" class="text-caption text-danger mt-1">{{ errors.title }}</p>
          </div>

          <div>
            <label for="welfare-description" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.description') }}</label>
            <textarea id="welfare-description" v-model="form.description" rows="2" class="vora-input resize-none" />
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="welfare-category" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.category') }}</label>
              <select id="welfare-category" v-model="form.category" class="vora-input">
                <option v-for="c in WELFARE_CATEGORIES" :key="c" :value="c">{{ $t(`welfare.category.${c}`) }}</option>
              </select>
            </div>
            <div>
              <label for="welfare-status" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.status') }}</label>
              <select id="welfare-status" v-model="form.status" class="vora-input">
                <option v-for="s in WELFARE_STATUSES" :key="s" :value="s">{{ $t(`welfare.status.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="welfare-enrolledCount" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.enrolledCount') }}</label>
              <input id="welfare-enrolledCount" v-model.number="form.enrolledCount" type="number" min="0" class="vora-input" >
            </div>
            <div>
              <label for="welfare-startDate" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.startDate') }}</label>
              <input id="welfare-startDate" v-model="form.startDate" type="date" class="vora-input" >
            </div>
            <div>
              <label for="welfare-endDate" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.endDate') }}</label>
              <input id="welfare-endDate" v-model="form.endDate" type="date" class="vora-input" >
            </div>
          </div>

          <div>
            <label for="welfare-notes" class="block text-label text-ink-400 mb-2">{{ $t('welfare.form.notes') }}</label>
            <textarea id="welfare-notes" v-model="form.notes" rows="2" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('welfare.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('welfare.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('welfare.form.saving') : $t('welfare.form.save') }}
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
