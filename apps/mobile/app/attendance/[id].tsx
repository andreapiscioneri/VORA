import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useAttendance } from '../../hooks/useAttendance'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { attendanceEntryInputSchema } from '@vora/shared/validation/attendance'
import type { ThemeColors } from '../../constants/theme'
import type { AttendanceEntryInput } from '@vora/shared/types/attendance'

export default function EditAttendanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { entries, update, remove } = useAttendance()
  const styles = makeStyles(colors)

  const entry = entries.find((e) => e.id === id)

  const [employeeName, setEmployeeName] = useState(entry?.employeeName ?? '')
  const [date, setDate] = useState(entry?.date ?? '')
  const [checkIn, setCheckIn] = useState(entry?.checkIn ?? '')
  const [checkOut, setCheckOut] = useState(entry?.checkOut ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!entry) {
    return (
      <DetailScreen title={t('modules.attendance.title')}>
        <StateMessage text={t('modules.attendance.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { employeeId: entry!.employeeId, employeeName, date, checkIn, checkOut, notes }
    const result = attendanceEntryInputSchema.safeParse(form)
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
      await update(id, result.data as AttendanceEntryInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.attendance.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.attendance.form.delete'), t('modules.attendance.deleteConfirm'), [
      { text: t('modules.attendance.form.cancel'), style: 'cancel' },
      {
        text: t('modules.attendance.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.attendance.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.attendance.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.attendance.form.employeeName')}</Text>
          <TextInput style={styles.input} value={employeeName} onChangeText={setEmployeeName} placeholderTextColor={colors.textSecondary} />
          {errors.employeeName ? <Text style={styles.error}>{errors.employeeName}</Text> : null}

          <Text style={styles.label}>{t('modules.attendance.form.date')}</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.date ? <Text style={styles.error}>{errors.date}</Text> : null}

          <Text style={styles.label}>{t('modules.attendance.form.checkIn')}</Text>
          <TextInput
            style={styles.input}
            value={checkIn}
            onChangeText={setCheckIn}
            placeholder="HH:mm"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.checkIn ? <Text style={styles.error}>{errors.checkIn}</Text> : null}

          <Text style={styles.label}>{t('modules.attendance.form.checkOut')}</Text>
          <TextInput
            style={styles.input}
            value={checkOut}
            onChangeText={setCheckOut}
            placeholder="HH:mm"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.attendance.form.notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.attendance.form.saving') : t('modules.attendance.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.attendance.form.delete')}</Text>
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
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
    deleteButton: { flexDirection: 'row', gap: spacing(2), alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(3), marginTop: spacing(4) },
    deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  })
}
