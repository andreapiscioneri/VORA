import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { usePayroll } from '../../hooks/usePayroll'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { payrollRecordInputSchema } from '@vora/shared/validation/payroll'
import { PAYROLL_STATUSES } from '@vora/shared/types/payroll'
import type { ThemeColors } from '../../constants/theme'
import type { PayrollRecordInput, PayrollStatus } from '@vora/shared/types/payroll'

export default function NewPayrollRecordScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = usePayroll()
  const styles = makeStyles(colors)

  const [employeeName, setEmployeeName] = useState('')
  const [period, setPeriod] = useState('')
  const [grossAmount, setGrossAmount] = useState('')
  const [netAmount, setNetAmount] = useState('')
  const [status, setStatus] = useState<PayrollStatus>('draft')
  const [payslipUrl, setPayslipUrl] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      employeeName,
      period,
      grossAmount: Number.parseFloat(grossAmount.replace(',', '.')) || 0,
      netAmount: Number.parseFloat(netAmount.replace(',', '.')) || 0,
      status,
      payslipUrl,
      paidAt: paidAt || null,
      notes,
    }
    const result = payrollRecordInputSchema.safeParse(form)
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
      await create(result.data as PayrollRecordInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.payroll.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.payroll.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.disclaimer}>{t('modules.payroll.disclaimer')}</Text>

          <Text style={styles.label}>{t('modules.payroll.form.employeeName')}</Text>
          <TextInput style={styles.input} value={employeeName} onChangeText={setEmployeeName} placeholderTextColor={colors.textSecondary} />
          {errors.employeeName ? <Text style={styles.error}>{errors.employeeName}</Text> : null}

          <Text style={styles.label}>{t('modules.payroll.form.period')}</Text>
          <TextInput
            style={styles.input}
            value={period}
            onChangeText={setPeriod}
            placeholder="YYYY-MM"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.period ? <Text style={styles.error}>{errors.period}</Text> : null}

          <Text style={styles.label}>{t('modules.payroll.form.grossAmount')}</Text>
          <TextInput
            style={styles.input}
            value={grossAmount}
            onChangeText={setGrossAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.payroll.form.netAmount')}</Text>
          <TextInput
            style={styles.input}
            value={netAmount}
            onChangeText={setNetAmount}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.payroll.form.status')}</Text>
          <View style={styles.chipRow}>
            {PAYROLL_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.payroll.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.payroll.form.payslipUrl')}</Text>
          <TextInput
            style={styles.input}
            value={payslipUrl}
            onChangeText={setPayslipUrl}
            placeholder="https://..."
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.payroll.form.paidAt')}</Text>
          <TextInput
            style={styles.input}
            value={paidAt}
            onChangeText={setPaidAt}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.payroll.form.notes')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('modules.payroll.form.saving') : t('modules.payroll.form.save')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    disclaimer: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing(2) },
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
