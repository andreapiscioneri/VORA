import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useMarketing } from '../../hooks/useMarketing'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { campaignInputSchema } from '@vora/shared/validation/campaign'
import type { ThemeColors } from '../../constants/theme'
import type { MarketingCampaignInput } from '@vora/shared/types/campaign'

export default function NewCampaignScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { createCampaign } = useMarketing()
  const styles = makeStyles(colors)

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { name, subject, body }
    const result = campaignInputSchema.safeParse(form)
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
      await createCampaign(result.data as MarketingCampaignInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.marketing.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.marketing.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.marketing.form.name')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textSecondary} />
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

          <Text style={styles.label}>{t('modules.marketing.form.subject')}</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholderTextColor={colors.textSecondary} />
          {errors.subject ? <Text style={styles.error}>{errors.subject}</Text> : null}

          <Text style={styles.label}>{t('modules.marketing.form.body')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={5}
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.marketing.form.saving') : t('modules.marketing.form.save')}</Text>
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
    textArea: { textAlignVertical: 'top', minHeight: spacing(28) },
    error: { color: colors.danger, fontSize: 13, marginTop: spacing(1) },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
  })
}
