import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useTickets } from '../../hooks/useTickets'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { ticketInputSchema } from '@vora/shared/validation/ticket'
import { TICKET_PRIORITIES } from '@vora/shared/types/ticket'
import type { ThemeColors } from '../../constants/theme'
import type { TicketInput, TicketPriority } from '@vora/shared/types/ticket'

export default function NewTicketScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useTickets()
  const styles = makeStyles(colors)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { title, description, priority, contactId: null, slaDueAt: null }
    const result = ticketInputSchema.safeParse(form)
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
      await create(result.data as TicketInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.helpdesk.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.helpdesk.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.helpdesk.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('modules.helpdesk.form.priority')}</Text>
          <View style={styles.chipRow}>
            {TICKET_PRIORITIES.map((p) => (
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
                <Text style={[styles.chipText, priority === p ? styles.chipTextActive : null]}>{t(`modules.helpdesk.priority.${p}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.helpdesk.form.description')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.helpdesk.form.saving') : t('modules.helpdesk.form.save')}</Text>
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
