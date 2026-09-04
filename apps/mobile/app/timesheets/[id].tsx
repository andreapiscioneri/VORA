import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useTimesheets } from '../../hooks/useTimesheets'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { timesheetEntryInputSchema } from '@vora/shared/validation/timesheet'
import type { ThemeColors } from '../../constants/theme'
import type { TimesheetEntryInput } from '@vora/shared/types/timesheet'

export default function EditTimesheetEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { entries, update, remove } = useTimesheets()
  const styles = makeStyles(colors)

  const entry = entries.find((e) => e.id === id)

  const [date, setDate] = useState(entry?.date ?? '')
  const [durationMinutes, setDurationMinutes] = useState(entry ? String(entry.durationMinutes) : '')
  const [description, setDescription] = useState(entry?.description ?? '')
  const [billable, setBillable] = useState(entry?.billable ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!entry) {
    return (
      <DetailScreen title={t('modules.timesheets.title')}>
        <StateMessage text={t('modules.timesheets.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { date, durationMinutes, description, billable, projectId: entry!.projectId, taskId: entry!.taskId }
    const result = timesheetEntryInputSchema.safeParse(form)
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
      await update(id, result.data as TimesheetEntryInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.timesheets.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.timesheets.form.delete'), t('modules.timesheets.deleteConfirm'), [
      { text: t('modules.timesheets.form.cancel'), style: 'cancel' },
      {
        text: t('modules.timesheets.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.timesheets.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.timesheets.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.timesheets.form.date')}</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />
          {errors.date ? <Text style={styles.error}>{errors.date}</Text> : null}

          <Text style={styles.label}>{t('modules.timesheets.form.durationMinutes')}</Text>
          <TextInput
            style={styles.input}
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.durationMinutes ? <Text style={styles.error}>{errors.durationMinutes}</Text> : null}

          <Text style={styles.label}>{t('modules.timesheets.form.billableToggle')}</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, billable ? styles.chipActive : null]}
              onPress={() => {
                haptics.selection()
                setBillable(true)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: billable }}
            >
              <Text style={[styles.chipText, billable ? styles.chipTextActive : null]}>{t('modules.timesheets.billable')}</Text>
            </Pressable>
            <Pressable
              style={[styles.chip, !billable ? styles.chipActive : null]}
              onPress={() => {
                haptics.selection()
                setBillable(false)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: !billable }}
            >
              <Text style={[styles.chipText, !billable ? styles.chipTextActive : null]}>{t('modules.timesheets.nonBillable')}</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t('modules.timesheets.form.description')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.timesheets.form.saving') : t('modules.timesheets.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.timesheets.form.delete')}</Text>
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
