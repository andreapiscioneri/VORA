import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useLeaveRequests } from '../../hooks/useLeaveRequests'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { leaveRequestInputSchema } from '@vora/shared/validation/leave'
import { LEAVE_TYPES } from '@vora/shared/types/leave'
import type { ThemeColors } from '../../constants/theme'
import type { LeaveRequestInput, LeaveType } from '@vora/shared/types/leave'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function NewLeaveRequestScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useLeaveRequests()
  const styles = makeStyles(colors)

  const [requesterName, setRequesterName] = useState('')
  const [type, setType] = useState<LeaveType>('vacation')
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso())
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { requesterName, type, startDate, endDate, notes }
    const result = leaveRequestInputSchema.safeParse(form)
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
      await create(result.data as LeaveRequestInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.leave.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.leave.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.leave.form.requesterName')}</Text>
          <TextInput style={styles.input} value={requesterName} onChangeText={setRequesterName} placeholderTextColor={colors.textSecondary} />
          {errors.requesterName ? <Text style={styles.error}>{errors.requesterName}</Text> : null}

          <Text style={styles.label}>{t('modules.leave.form.type')}</Text>
          <View style={styles.chipRow}>
            {LEAVE_TYPES.map((lt) => (
              <Pressable
                key={lt}
                style={[styles.chip, type === lt ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setType(lt)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: type === lt }}
              >
                <Text style={[styles.chipText, type === lt ? styles.chipTextActive : null]}>{t(`modules.leave.type.${lt}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.leave.form.startDate')}</Text>
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.leave.form.endDate')}</Text>
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />
          {errors.endDate ? <Text style={styles.error}>{errors.endDate}</Text> : null}

          <Text style={styles.label}>{t('modules.leave.form.notes')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.leave.form.saving') : t('modules.leave.form.save')}</Text>
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
  })
}
