import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useTraining } from '../../hooks/useTraining'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { trainingCourseInputSchema } from '@vora/shared/validation/training'
import { TRAINING_STATUSES } from '@vora/shared/types/training'
import type { ThemeColors } from '../../constants/theme'
import type { TrainingCourseInput, TrainingStatus } from '@vora/shared/types/training'

export default function NewTrainingCourseScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useTraining()
  const styles = makeStyles(colors)

  const [title, setTitle] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [provider, setProvider] = useState('')
  const [status, setStatus] = useState<TrainingStatus>('planned')
  const [startDate, setStartDate] = useState('')
  const [completionDate, setCompletionDate] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      title,
      employeeName,
      provider,
      status,
      startDate: startDate || null,
      completionDate: completionDate || null,
      certificateUrl,
      notes,
    }
    const result = trainingCourseInputSchema.safeParse(form)
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
      await create(result.data as TrainingCourseInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.training.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.training.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.training.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('modules.training.form.employeeName')}</Text>
          <TextInput style={styles.input} value={employeeName} onChangeText={setEmployeeName} placeholderTextColor={colors.textSecondary} />
          {errors.employeeName ? <Text style={styles.error}>{errors.employeeName}</Text> : null}

          <Text style={styles.label}>{t('modules.training.form.provider')}</Text>
          <TextInput style={styles.input} value={provider} onChangeText={setProvider} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.training.form.status')}</Text>
          <View style={styles.chipRow}>
            {TRAINING_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.training.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.training.form.startDate')}</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.training.form.completionDate')}</Text>
          <TextInput
            style={styles.input}
            value={completionDate}
            onChangeText={setCompletionDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.training.form.certificateUrl')}</Text>
          <TextInput
            style={styles.input}
            value={certificateUrl}
            onChangeText={setCertificateUrl}
            placeholder="https://..."
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.training.form.notes')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.training.form.saving') : t('modules.training.form.save')}</Text>
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
