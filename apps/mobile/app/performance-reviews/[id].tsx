import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { usePerformanceReviews } from '../../hooks/usePerformanceReviews'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { performanceReviewInputSchema } from '@vora/shared/validation/performanceReview'
import { REVIEW_STATUSES } from '@vora/shared/types/performanceReview'
import type { ThemeColors } from '../../constants/theme'
import type { PerformanceReviewInput, ReviewStatus } from '@vora/shared/types/performanceReview'

export default function EditPerformanceReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { reviews, update, remove } = usePerformanceReviews()
  const styles = makeStyles(colors)

  const review = reviews.find((r) => r.id === id)

  const [employeeName, setEmployeeName] = useState(review?.employeeName ?? '')
  const [period, setPeriod] = useState(review?.period ?? '')
  const [reviewerName, setReviewerName] = useState(review?.reviewerName ?? '')
  const [rating, setRating] = useState(review ? String(review.rating) : '3')
  const [strengths, setStrengths] = useState(review?.strengths ?? '')
  const [improvements, setImprovements] = useState(review?.improvements ?? '')
  const [goals, setGoals] = useState(review?.goals ?? '')
  const [status, setStatus] = useState<ReviewStatus>(review?.status ?? 'draft')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!review) {
    return (
      <DetailScreen title={t('modules.performanceReviews.title')}>
        <StateMessage text={t('modules.performanceReviews.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      employeeId: review!.employeeId,
      employeeName,
      period,
      reviewerName,
      rating,
      strengths,
      improvements,
      goals,
      status,
      reviewDate: review!.reviewDate,
    }
    const result = performanceReviewInputSchema.safeParse(form)
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
      await update(id, result.data as PerformanceReviewInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.performanceReviews.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.performanceReviews.form.delete'), t('modules.performanceReviews.deleteConfirm'), [
      { text: t('modules.performanceReviews.form.cancel'), style: 'cancel' },
      {
        text: t('modules.performanceReviews.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.performanceReviews.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.performanceReviews.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.performanceReviews.form.employeeName')}</Text>
          <TextInput style={styles.input} value={employeeName} onChangeText={setEmployeeName} placeholderTextColor={colors.textSecondary} />
          {errors.employeeName ? <Text style={styles.error}>{errors.employeeName}</Text> : null}

          <Text style={styles.label}>{t('modules.performanceReviews.form.period')}</Text>
          <TextInput style={styles.input} value={period} onChangeText={setPeriod} placeholderTextColor={colors.textSecondary} />
          {errors.period ? <Text style={styles.error}>{errors.period}</Text> : null}

          <Text style={styles.label}>{t('modules.performanceReviews.form.reviewerName')}</Text>
          <TextInput style={styles.input} value={reviewerName} onChangeText={setReviewerName} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.performanceReviews.form.rating')}</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                style={[styles.chip, Number(rating) === n ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setRating(String(n))
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: Number(rating) === n }}
              >
                <Text style={[styles.chipText, Number(rating) === n ? styles.chipTextActive : null]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.performanceReviews.form.status')}</Text>
          <View style={styles.chipRow}>
            {REVIEW_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.performanceReviews.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.performanceReviews.form.strengths')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={strengths}
            onChangeText={setStrengths}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.performanceReviews.form.improvements')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={improvements}
            onChangeText={setImprovements}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.performanceReviews.form.goals')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={goals}
            onChangeText={setGoals}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.performanceReviews.form.saving') : t('modules.performanceReviews.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.performanceReviews.form.delete')}</Text>
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
    textArea: { textAlignVertical: 'top', minHeight: spacing(16) },
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
