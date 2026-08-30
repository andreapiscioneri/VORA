import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useProjects } from '../../hooks/useProjects'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { projectInputSchema } from '@vora/shared/validation/project'
import { PROJECT_STATUSES } from '@vora/shared/types/project'
import type { ThemeColors } from '../../constants/theme'
import type { ProjectInput, ProjectStatus } from '@vora/shared/types/project'

export default function NewProjectScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useProjects()
  const styles = makeStyles(colors)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [budget, setBudget] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { name, description, status, budget, dueDate: dueDate || null, contactId: null, startDate: null }
    const result = projectInputSchema.safeParse(form)
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
      await create(result.data as ProjectInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.projects.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.projects.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.projects.form.name')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textSecondary} />
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

          <Text style={styles.label}>{t('modules.projects.form.status')}</Text>
          <View style={styles.chipRow}>
            {PROJECT_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.projects.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.projects.form.budget')}</Text>
          <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.projects.form.dueDate')}</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.projects.form.description')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.projects.form.saving') : t('modules.projects.form.save')}</Text>
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
