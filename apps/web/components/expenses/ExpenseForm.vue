<script setup lang="ts">
import type { Expense, ExpenseInput } from '~/shared/types/expense'
import { expenseInputSchema } from '~/shared/validation/expense'

const props = defineProps<{ expense?: Expense | null }>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()

const { createExpense, updateExpense, removeExpense } = useExpenses()
const { projects, fetchProjects } = useProjects()
const { t } = useI18n()

if (!projects.value.length) await fetchProjects()

const isEdit = computed(() => !!props.expense)

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = reactive<ExpenseInput>({
  amount: props.expense?.amount ?? 0,
  currency: props.expense?.currency ?? 'EUR',
  category: props.expense?.category ?? 'other',
  date: props.expense?.date ?? todayIso(),
  projectId: props.expense?.projectId ?? null,
  contactId: props.expense?.contactId ?? null,
  status: props.expense?.status ?? 'pending',
  notes: props.expense?.notes ?? '',
  receiptUrl: props.expense?.receiptUrl ?? '',
})

const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')

async function onSubmit() {
  Object.keys(errors).forEach((k) => { errors[k] = '' })
  saveError.value = ''

  const result = expenseInputSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors[String(issue.path[0])] = t(issue.message)
    }
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.expense) {
      await updateExpense(props.expense.id, result.data)
    } else {
      await createExpense(result.data)
    }
    emit('saved')
  } catch {
    saveError.value = t('expenses.errors.save')
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.expense) return
  if (!confirm(t('expenses.deleteConfirm'))) return
  await removeExpense(props.expense.id)
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
      aria-labelledby="expense-form-title"
      tabindex="-1"
      @keydown.esc="emit('close')"
    >
      <div class="w-full tablet:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-xl tablet:rounded-lg bg-paper-50 dark:bg-ink-900 shadow-2xl animate-fade-up tablet:animate-none">
        <form class="p-6 space-y-6" @submit.prevent="onSubmit">
          <h2 id="expense-form-title" class="text-h3 font-semibold">
            {{ isEdit ? $t('expenses.form.editTitle') : $t('expenses.form.newTitle') }}
          </h2>

          <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
            <div>
              <label for="expense-amount" class="block text-label text-ink-400 mb-2">{{ $t('expenses.form.amount') }}</label>
              <input id="expense-amount" v-model.number="form.amount" type="number" min="0.01" step="0.01" class="vora-input" :class="{ 'border-danger': errors.amount }" autofocus >
              <p v-if="errors.amount" class="text-caption text-danger mt-1">{{ errors.amount }}</p>
            </div>
            <div>
              <label for="expense-date" class="block text-label text-ink-400 mb-2">{{ $t('expenses.form.date') }}</label>
              <input id="expense-date" v-model="form.date" type="date" class="vora-input" >
            </div>
            <div>
              <label for="expense-category" class="block text-label text-ink-400 mb-2">{{ $t('expenses.form.category') }}</label>
              <select id="expense-category" v-model="form.category" class="vora-input">
                <option v-for="c in ['travel', 'meals', 'office', 'software', 'other']" :key="c" :value="c">{{ $t(`expenses.category.${c}`) }}</option>
              </select>
            </div>
            <div>
              <label for="expense-projectId" class="block text-label text-ink-400 mb-2">{{ $t('expenses.form.project') }}</label>
              <select id="expense-projectId" v-model="form.projectId" class="vora-input">
                <option :value="null">{{ $t('expenses.form.noProject') }}</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
          </div>

          <div>
            <label for="expense-receiptUrl" class="block text-label text-ink-400 mb-2">{{ $t('expenses.form.receiptUrl') }}</label>
            <input id="expense-receiptUrl" v-model="form.receiptUrl" type="text" placeholder="https://..." class="vora-input" >
          </div>

          <div>
            <label for="expense-notes" class="block text-label text-ink-400 mb-2">{{ $t('expenses.form.notes') }}</label>
            <textarea id="expense-notes" v-model="form.notes" rows="2" class="vora-input resize-none" />
          </div>

          <p v-if="saveError" class="text-body-sm text-danger">{{ saveError }}</p>

          <div class="flex items-center justify-between gap-3 pt-2">
            <button v-if="isEdit" type="button" class="flex items-center gap-2 px-3 py-2 rounded-md text-body-sm text-danger hover:bg-danger/5" @click="onDelete">
              <UiIcon name="trash" :size="16" />
              {{ $t('expenses.form.delete') }}
            </button>
            <div class="ml-auto flex items-center gap-3">
              <button type="button" class="px-4 py-2 rounded-md text-body-sm text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5" @click="emit('close')">
                {{ $t('expenses.form.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('expenses.form.saving') : $t('expenses.form.save') }}
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
