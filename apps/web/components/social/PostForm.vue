<script setup lang="ts">
import type { SocialPost, SocialPostInput } from '~/shared/types/social-post'
import { socialPostInputSchema } from '~/shared/validation/social-post'

const props = defineProps<{ post?: SocialPost | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createPost, updatePost, removePost } = useSocialPosts()
const { t } = useI18n()

const isEdit = computed(() => !!props.post)

const form = reactive<SocialPostInput>({
  content: props.post?.content ?? '',
  platform: props.post?.platform ?? 'instagram',
  status: props.post?.status ?? 'draft',
  scheduledAt: props.post?.scheduledAt ?? null,
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => delete errors[k])
  saveError.value = ''

  const result = socialPostInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.post) {
      await updatePost(props.post.id, result.data)
    } else {
      await createPost(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('social.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.post) return
  if (!confirm(t('social.deleteConfirm'))) return
  await removePost(props.post.id)
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
      aria-labelledby="post-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="post-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('social.form.editTitle') : $t('social.form.newTitle') }}
          </h2>

          <div>
            <label for="post-content" class="block text-label text-ink-400 mb-2">{{ $t('social.form.content') }}</label>
            <textarea id="post-content" v-model="form.content" rows="4" class="vora-input resize-none" :class="{ 'border-danger': errors.content }" autofocus />
            <p v-if="errors.content" class="text-caption text-danger mt-1">{{ errors.content }}</p>
          </div>

          <div class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
            <div>
              <label for="post-platform" class="block text-label text-ink-400 mb-2">{{ $t('social.form.platform') }}</label>
              <select id="post-platform" v-model="form.platform" class="vora-input">
                <option v-for="p in ['instagram', 'facebook', 'linkedin', 'x']" :key="p" :value="p">{{ $t(`social.platform.${p}`) }}</option>
              </select>
            </div>
            <div>
              <label for="post-status" class="block text-label text-ink-400 mb-2">{{ $t('social.form.status') }}</label>
              <select id="post-status" v-model="form.status" class="vora-input">
                <option v-for="s in ['draft', 'scheduled', 'published']" :key="s" :value="s">{{ $t(`social.status.${s}`) }}</option>
              </select>
            </div>
            <div>
              <label for="post-scheduledAt" class="block text-label text-ink-400 mb-2">{{ $t('social.form.scheduledAt') }}</label>
              <input id="post-scheduledAt" v-model="form.scheduledAt" type="datetime-local" class="vora-input" />
            </div>
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('social.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('social.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('social.form.saving') : $t('social.form.save') }}
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
