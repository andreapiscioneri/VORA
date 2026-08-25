import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useEmployees } from '../../hooks/useEmployees'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { employeeInputSchema } from '@vora/shared/validation/employee'
import { EMPLOYEE_STATUSES } from '@vora/shared/types/employee'
import type { ThemeColors } from '../../constants/theme'
import type { EmployeeInput, EmployeeStatus } from '@vora/shared/types/employee'

export default function EditEmployeeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { employees, update, remove } = useEmployees()
  const styles = makeStyles(colors)

  const employee = employees.find((e) => e.id === id)

  const [firstName, setFirstName] = useState(employee?.firstName ?? '')
  const [lastName, setLastName] = useState(employee?.lastName ?? '')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [role, setRole] = useState(employee?.role ?? '')
  const [team, setTeam] = useState(employee?.team ?? '')
  const [status, setStatus] = useState<EmployeeStatus>(employee?.status ?? 'active')
  const [startDate, setStartDate] = useState(employee?.startDate ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!employee) {
    return (
      <DetailScreen title={t('modules.employees.title')}>
        <StateMessage text={t('modules.employees.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { firstName, lastName, email, role, team, status, startDate: startDate || null }
    const result = employeeInputSchema.safeParse(form)
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
      await update(id, result.data as EmployeeInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.employees.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.employees.form.delete'), t('modules.employees.deleteConfirm'), [
      { text: t('modules.employees.form.cancel'), style: 'cancel' },
      {
        text: t('modules.employees.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.employees.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.employees.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.employees.form.firstName')}</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} autoCapitalize="words" placeholderTextColor={colors.textSecondary} />
          {errors.firstName ? <Text style={styles.error}>{errors.firstName}</Text> : null}

          <Text style={styles.label}>{t('modules.employees.form.lastName')}</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} autoCapitalize="words" placeholderTextColor={colors.textSecondary} />
          {errors.lastName ? <Text style={styles.error}>{errors.lastName}</Text> : null}

          <Text style={styles.label}>{t('modules.employees.form.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

          <Text style={styles.label}>{t('modules.employees.form.role')}</Text>
          <TextInput style={styles.input} value={role} onChangeText={setRole} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.employees.form.team')}</Text>
          <TextInput style={styles.input} value={team} onChangeText={setTeam} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.employees.form.status')}</Text>
          <View style={styles.segmented}>
            {EMPLOYEE_STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[styles.segment, status === s ? styles.segmentActive : null]}
                onPress={() => {
                  haptics.selection()
                  setStatus(s)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: status === s }}
              >
                <Text style={[styles.segmentText, status === s ? styles.segmentTextActive : null]}>{t(`modules.employees.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.employees.form.startDate')}</Text>
          <TextInput
            style={styles.input}
            value={startDate ?? ''}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.employees.form.saving') : t('modules.employees.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.employees.form.delete')}</Text>
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
    error: { color: colors.danger, fontSize: 13, marginTop: spacing(1) },
    segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing(1) },
    segment: { flex: 1, paddingVertical: spacing(2), borderRadius: radius.sm, alignItems: 'center' },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    segmentTextActive: { color: '#0A0A0A' },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
    deleteButton: { flexDirection: 'row', gap: spacing(2), alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(3), marginTop: spacing(4) },
    deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  })
}
