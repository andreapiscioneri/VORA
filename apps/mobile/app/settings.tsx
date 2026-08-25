import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { DetailScreen } from '../components/Screen'
import { useAuth, ApiError } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import { radius, spacing } from '../constants/theme'
import { scorePassword } from '@vora/shared/validation/password'
import type { ThemeColors } from '../constants/theme'

const STRENGTH_LABELS = ['modules.settings.strength.veryWeak', 'modules.settings.strength.weak', 'modules.settings.strength.fair', 'modules.settings.strength.good', 'modules.settings.strength.strong']

export default function SettingsScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { user } = useAuth()
  const styles = makeStyles(colors)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submitPasswordChange() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setSuccess(true)
      haptics.success()
    } catch (e) {
      haptics.error()
      if (e instanceof ApiError && e.status === 401) {
        setError(t('modules.settings.currentPasswordIncorrect'))
      } else if (e instanceof ApiError && e.status === 422) {
        setError(scorePassword(newPassword).weak ? t('modules.settings.passwordTooWeak') : t('modules.settings.passwordTooShort'))
      } else if (e instanceof ApiError && e.status === 429) {
        setError(t('modules.settings.tooManyAttempts'))
      } else {
        setError(t('modules.settings.saveError'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.settings.title')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>{t('modules.settings.profile')}</Text>
          <View style={styles.card}>
            <Row label={t('modules.settings.name')} value={user?.name ?? ''} colors={colors} />
            <Row label={t('modules.settings.email')} value={user?.email ?? ''} colors={colors} />
            <Row label={t('modules.settings.organization')} value={user?.organizationName ?? ''} colors={colors} />
            <Row label={t('modules.settings.role')} value={user?.role ?? ''} colors={colors} last />
          </View>

          <Text style={[styles.sectionLabel, { marginTop: spacing(6) }]}>{t('modules.settings.changePassword')}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>{t('modules.settings.currentPassword')}</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoComplete="current-password"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.label}>{t('modules.settings.newPassword')}</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholderTextColor={colors.textSecondary}
            />
            {newPassword ? (
              <Text style={[styles.strengthHint, scorePassword(newPassword).weak ? { color: colors.danger } : null]}>
                {t(STRENGTH_LABELS[scorePassword(newPassword).score])}
              </Text>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{t('modules.settings.passwordChanged')}</Text> : null}

            <Pressable
              style={[styles.submit, (saving || !currentPassword || newPassword.length < 8) ? styles.submitDisabled : null]}
              disabled={saving || !currentPassword || newPassword.length < 8}
              onPress={submitPasswordChange}
              accessibilityRole="button"
              accessibilityLabel={t('modules.settings.save')}
            >
              <Text style={styles.submitText}>{saving ? t('modules.settings.saving') : t('modules.settings.save')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DetailScreen>
  )
}

function Row({ label, value, colors, last }: { label: string; value: string; colors: ThemeColors; last?: boolean }) {
  return (
    <View style={[rowStyles.row, last ? null : { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(3) },
  label: { fontSize: 13 },
  value: { fontSize: 14, fontWeight: '500', flexShrink: 1, marginLeft: spacing(3) },
})

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing(2) },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing(4) },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing(1), marginTop: spacing(3) },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(3),
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    strengthHint: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    error: { color: colors.danger, fontSize: 13, marginTop: spacing(3) },
    success: { color: colors.primary, fontSize: 13, marginTop: spacing(3) },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(4), marginBottom: spacing(4), alignItems: 'center' },
    submitDisabled: { opacity: 0.5 },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
  })
}
