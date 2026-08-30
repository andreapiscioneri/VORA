import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useOpportunities } from '../../hooks/useOpportunities'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { opportunityInputSchema } from '@vora/shared/validation/opportunity'
import { OPPORTUNITY_STAGES } from '@vora/shared/types/opportunity'
import type { ThemeColors } from '../../constants/theme'
import type { OpportunityInput, OpportunityStage } from '@vora/shared/types/opportunity'

export default function NewOpportunityScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useOpportunities()
  const styles = makeStyles(colors)

  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState<OpportunityStage>('lead')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { title, company, value, stage, notes, contactId: null, expectedCloseDate: null }
    const result = opportunityInputSchema.safeParse(form)
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
      await create(result.data as OpportunityInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.crm.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.crm.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.crm.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('modules.crm.form.company')}</Text>
          <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.crm.form.value')}</Text>
          <TextInput style={styles.input} value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.crm.form.stage')}</Text>
          <View style={styles.chipRow}>
            {OPPORTUNITY_STAGES.map((s) => (
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
                <Text style={[styles.chipText, stage === s ? styles.chipTextActive : null]}>{t(`modules.crm.stage.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.crm.form.notes')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.crm.form.saving') : t('modules.crm.form.save')}</Text>
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
