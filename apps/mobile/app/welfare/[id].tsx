import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useWelfare } from '../../hooks/useWelfare'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { welfareInitiativeInputSchema } from '@vora/shared/validation/welfare'
import { WELFARE_CATEGORIES, WELFARE_STATUSES } from '@vora/shared/types/welfare'
import type { ThemeColors } from '../../constants/theme'
import type { WelfareCategory, WelfareInitiativeInput, WelfareStatus } from '@vora/shared/types/welfare'

export default function EditWelfareInitiativeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { initiatives, update, remove } = useWelfare()
  const styles = makeStyles(colors)

  const initiative = initiatives.find((i) => i.id === id)

  const [title, setTitle] = useState(initiative?.title ?? '')
  const [description, setDescription] = useState(initiative?.description ?? '')
  const [category, setCategory] = useState<WelfareCategory>(initiative?.category ?? 'other')
  const [status, setStatus] = useState<WelfareStatus>(initiative?.status ?? 'active')
  const [enrolledCount, setEnrolledCount] = useState(String(initiative?.enrolledCount ?? 0))
  const [startDate, setStartDate] = useState(initiative?.startDate ?? '')
  const [endDate, setEndDate] = useState(initiative?.endDate ?? '')
  const [notes, setNotes] = useState(initiative?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!initiative) {
    return (
      <DetailScreen title={t('modules.welfare.title')}>
        <StateMessage text={t('modules.welfare.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      title,
      description,
      category,
      status,
      enrolledCount: Number.parseInt(enrolledCount, 10) || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      notes,
    }
    const result = welfareInitiativeInputSchema.safeParse(form)
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
      await update(id, result.data as WelfareInitiativeInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.welfare.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.welfare.form.delete'), t('modules.welfare.deleteConfirm'), [
      { text: t('modules.welfare.form.cancel'), style: 'cancel' },
      {
        text: t('modules.welfare.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.welfare.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.welfare.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.welfare.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('modules.welfare.form.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.welfare.form.category')}</Text>
          <View style={styles.chipRow}>
            {WELFARE_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, category === c ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setCategory(c)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: category === c }}
              >
                <Text style={[styles.chipText, category === c ? styles.chipTextActive : null]}>{t(`modules.welfare.category.${c}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.welfare.form.status')}</Text>
          <View style={styles.chipRow}>
            {WELFARE_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.welfare.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.welfare.form.enrolledCount')}</Text>
          <TextInput
            style={styles.input}
            value={enrolledCount}
            onChangeText={setEnrolledCount}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.welfare.form.startDate')}</Text>
          <TextInput
            style={styles.input}
            value={startDate ?? ''}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.welfare.form.endDate')}</Text>
          <TextInput
            style={styles.input}
            value={endDate ?? ''}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.welfare.form.notes')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.welfare.form.saving') : t('modules.welfare.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.welfare.form.delete')}</Text>
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
