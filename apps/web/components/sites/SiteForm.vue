<script setup lang="ts">
import type { MicroSite, MicroSiteInput } from '~/shared/types/microsite'
import { microSiteInputSchema } from '~/shared/validation/microsite'

const props = defineProps<{ site?: MicroSite | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createSite, updateSite, removeSite } = useMicrosites()
const { t } = useI18n()

const isEdit = computed(() => !!props.site)

const form = reactive<MicroSiteInput>({
  slug: props.site?.slug ?? '',
  name: props.site?.name ?? '',
  tagline: props.site?.tagline ?? '',
  about: props.site?.about ?? '',
  contactEmail: props.site?.contactEmail ?? '',
  accentColor: props.site?.accentColor ?? '#39FF14',
  published: props.site?.published ?? false,
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = microSiteInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.site) {
      await updateSite(props.site.id, result.data)
    } else {
      await createSite(result.data)
    }
    emit('saved')
  } catch (e) {
    const err = e as { data?: { data?: { fieldErrors?: Record<string, string[]> } } }
    const fieldErrors = err.data?.data?.fieldErrors
    if (fieldErrors?.slug) {
      errors.slug = t(fieldErrors.slug[0])
    } else {
      saveError.value = t('sites.errors.save')
    }
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.site) return
  if (!confirm(t('sites.deleteConfirm'))) return
  await removeSite(props.site.id)
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
      aria-labelledby="site-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="site-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('sites.form.editTitle') : $t('sites.form.newTitle') }}
          </h2>

          <div>
            <label for="site-slug" class="block text-label text-ink-400 mb-2">{{ $t('sites.form.slug') }}</label>
            <input id="site-slug" v-model="form.slug" type="text" class="vora-input font-mono" :class="{ 'border-danger': errors.slug }" autofocus >
            <p class="text-caption text-ink-400 mt-1">{{ $t('sites.form.slugHint', { slug: form.slug || '…' }) }}</p>
            <p v-if="errors.slug" class="text-caption text-danger mt-1">{{ errors.slug }}</p>
          </div>

          <div>
            <label for="site-name" class="block text-label text-ink-400 mb-2">{{ $t('sites.form.name') }}</label>
            <input id="site-name" v-model="form.name" type="text" class="vora-input" :class="{ 'border-danger': errors.name }" >
            <p v-if="errors.name" class="text-caption text-danger mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label for="site-tagline" class="block text-label text-ink-400 mb-2">{{ $t('sites.form.tagline') }}</label>
            <input id="site-tagline" v-model="form.tagline" type="text" class="vora-input" >
          </div>

          <div>
            <label for="site-about" class="block text-label text-ink-400 mb-2">{{ $t('sites.form.about') }}</label>
            <textarea id="site-about" v-model="form.about" rows="4" class="vora-input resize-none" />
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="site-contactEmail" class="block text-label text-ink-400 mb-2">{{ $t('sites.form.contactEmail') }}</label>
              <input id="site-contactEmail" v-model="form.contactEmail" type="email" class="vora-input" :class="{ 'border-danger': errors.contactEmail }" >
              <p v-if="errors.contactEmail" class="text-caption text-danger mt-1">{{ errors.contactEmail }}</p>
            </div>
            <div>
              <label for="site-accentColor" class="block text-label text-ink-400 mb-2">{{ $t('sites.form.accentColor') }}</label>
              <div class="flex items-center gap-2">
                <input v-model="form.accentColor" type="color" class="h-10 w-12 rounded-md border border-ink-100 dark:border-white/10 shrink-0" :aria-label="$t('sites.form.accentColor')" >
                <input id="site-accentColor" v-model="form.accentColor" type="text" class="vora-input font-mono" :class="{ 'border-danger': errors.accentColor }" >
              </div>
              <p v-if="errors.accentColor" class="text-caption text-danger mt-1">{{ errors.accentColor }}</p>
            </div>
          </div>

          <label class="flex items-center gap-2 text-body-sm">
            <input v-model="form.published" type="checkbox" class="size-4 rounded accent-primary" >
            {{ $t('sites.form.published') }}
          </label>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('sites.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('sites.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('sites.form.saving') : $t('sites.form.save') }}
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
