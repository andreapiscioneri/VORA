<script setup lang="ts">
import type { Segment, SegmentInput } from '~/shared/types/segment'
import { segmentInputSchema } from '~/shared/validation/segment'
import { CONTACT_STATUSES } from '~/shared/types/contact'

const props = defineProps<{ segment?: Segment | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createSegment, updateSegment, removeSegment } = useSegments()
const { t } = useI18n()

const isEdit = computed(() => !!props.segment)

const name = ref(props.segment?.name ?? '')
const status = ref<string>(props.segment?.filter.status ?? '')
const tagsText = ref((props.segment?.filter.tags ?? []).join(', '))

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

function buildInput(): SegmentInput {
  const tags = tagsText.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return {
    name: name.value,
    filter: {
      status: status.value ? (status.value as (typeof CONTACT_STATUSES)[number]) : undefined,
      tags,
    },
  }
}

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = segmentInputSchema.safeParse(buildInput())
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.segment) {
      await updateSegment(props.segment.id, result.data)
    } else {
      await createSegment(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('segments.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.segment) return
  if (!confirm(t('segments.deleteConfirm'))) return
  await removeSegment(props.segment.id)
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
      aria-labelledby="segment-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="segment-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('segments.form.editTitle') : $t('segments.form.newTitle') }}
          </h2>

          <div>
            <label for="segment-name" class="block text-label text-ink-400 mb-2">{{ $t('segments.form.name') }}</label>
            <input id="segment-name" v-model="name" type="text" class="vora-input" :class="{ 'border-danger': errors.name }" autofocus >
            <p v-if="errors.name" class="text-caption text-danger mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label for="segment-status" class="block text-label text-ink-400 mb-2">{{ $t('segments.form.status') }}</label>
            <select id="segment-status" v-model="status" class="vora-input">
              <option value="">{{ $t('segments.form.anyStatus') }}</option>
              <option v-for="s in CONTACT_STATUSES" :key="s" :value="s">{{ $t(`contacts.status.${s}`) }}</option>
            </select>
          </div>

          <div>
            <label for="segment-tags" class="block text-label text-ink-400 mb-2">{{ $t('segments.form.tags') }}</label>
            <input id="segment-tags" v-model="tagsText" type="text" class="vora-input" :placeholder="$t('segments.form.tagsPlaceholder')" >
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('segments.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('segments.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('segments.form.saving') : $t('segments.form.save') }}
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
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors disabled:opacity-60;
}
</style>
