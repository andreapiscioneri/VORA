import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useCandidates } from '../../hooks/useCandidates'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { candidateInputSchema } from '@vora/shared/validation/candidate'
import { CANDIDATE_STAGES } from '@vora/shared/types/candidate'
import type { ThemeColors } from '../../constants/theme'
import type { CandidateInput, CandidateStage } from '@vora/shared/types/candidate'

export default function NewCandidateScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useCandidates()
  const styles = makeStyles(colors)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [stage, setStage] = useState<CandidateStage>('applied')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { firstName, lastName, email, phone, role, stage, notes, source: 'other', resumeUrl: '', interviewDate: null }
    const result = candidateInputSchema.safeParse(form)
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
      await create(result.data as CandidateInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.recruiting.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.recruiting.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.recruiting.form.firstName')}</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholderTextColor={colors.textSecondary} />
          {errors.firstName ? <Text style={styles.error}>{errors.firstName}</Text> : null}

          <Text style={styles.label}>{t('modules.recruiting.form.lastName')}</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholderTextColor={colors.textSecondary} />
          {errors.lastName ? <Text style={styles.error}>{errors.lastName}</Text> : null}

          <Text style={styles.label}>{t('modules.recruiting.form.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

          <Text style={styles.label}>{t('modules.recruiting.form.phone')}</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.recruiting.form.role')}</Text>
          <TextInput style={styles.input} value={role} onChangeText={setRole} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.recruiting.form.stage')}</Text>
          <View style={styles.chipRow}>
            {CANDIDATE_STAGES.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, stage === s ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setStage(s)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: stage === s }}
              >
                <Text style={[styles.chipText, stage === s ? styles.chipTextActive : null]}>{t(`modules.recruiting.stage.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.recruiting.form.notes')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.recruiting.form.saving') : t('modules.recruiting.form.save')}</Text>
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
