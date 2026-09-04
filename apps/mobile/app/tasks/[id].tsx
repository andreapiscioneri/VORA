import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useTasks } from '../../hooks/useTasks'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { taskInputSchema } from '@vora/shared/validation/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '@vora/shared/types/task'
import type { ThemeColors } from '../../constants/theme'
import type { TaskInput, TaskPriority, TaskStatus } from '@vora/shared/types/task'

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { tasks, update, remove } = useTasks()
  const styles = makeStyles(colors)

  const task = tasks.find((tsk) => tsk.id === id)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')
  const [deadline, setDeadline] = useState(task?.deadline ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!task) {
    return (
      <DetailScreen title={t('tasks.title')}>
        <StateMessage text={t('tasks.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      title,
      description,
      priority,
      status,
      deadline: deadline || null,
      tags: task!.tags,
      checklist: task!.checklist,
      contactId: task!.contactId,
      projectId: task!.projectId,
      attachments: task!.attachments,
    }
    const result = taskInputSchema.safeParse(form)
    if (!result.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        nextErrors[String(issue.path[0])] = t(issue.message)
      }
      setErrors(nextErrors)
      haptics.error()
      return
    }
    setErrors({})

    setSaving(true)
    try {
      await update(id, result.data as TaskInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('tasks.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('tasks.form.delete'), t('tasks.deleteConfirm'), [
      { text: t('tasks.form.cancel'), style: 'cancel' },
      {
        text: t('tasks.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('tasks.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('tasks.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('tasks.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('tasks.form.priority')}</Text>
          <View style={styles.chipRow}>
            {TASK_PRIORITIES.map((p) => (
              <Pressable
                key={p}
                style={[styles.chip, priority === p ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setPriority(p)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: priority === p }}
              >
                <Text style={[styles.chipText, priority === p ? styles.chipTextActive : null]}>{t(`tasks.priority.${p}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('tasks.form.status')}</Text>
          <View style={styles.chipRow}>
            {TASK_STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, status === s ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setStatus(s)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: status === s }}
              >
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`tasks.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('tasks.form.deadline')}</Text>
          <TextInput
            style={styles.input}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('tasks.form.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('tasks.form.saving') : t('tasks.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('tasks.form.delete')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing(1), marginTop: spacing(3) },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(3),
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    textArea: { textAlignVertical: 'top', minHeight: spacing(20) },
    error: { color: colors.danger, fontSize: 13, marginTop: spacing(1) },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#0A0A0A' },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
    deleteButton: { flexDirection: 'row', gap: spacing(2), alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(3), marginTop: spacing(4) },
    deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  })
}
