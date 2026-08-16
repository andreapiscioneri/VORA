import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { BrandMark } from '../components/BrandMark'
import { Wordmark } from '../components/Wordmark'
import { useAuth, ApiError } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { radius, spacing } from '../constants/theme'
import type { ThemeColors } from '../constants/theme'

export default function LoginScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { login, register } = useAuth()
  const router = useRouter()
  const styles = makeStyles(colors)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password, organizationName)
      }
      router.replace('/')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError(t('auth.emailTaken'))
      } else if (e instanceof ApiError && (e.status === 401 || e.status === 422)) {
        setError(mode === 'login' ? t('auth.invalidCredentials') : t('auth.passwordTooShort'))
      } else {
        setError(t('auth.invalidCredentials'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <BrandMark size={32} />
          <Wordmark size={28} color={colors.textPrimary} />
        </View>

        <Text style={styles.title}>{mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}</Text>

        {mode === 'register' && (
          <>
            <Text style={styles.label}>{t('auth.name')}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} autoCapitalize="words" placeholderTextColor={colors.textSecondary} />
            <Text style={styles.label}>{t('auth.organizationName')}</Text>
            <TextInput
              style={styles.input}
              value={organizationName}
              onChangeText={setOrganizationName}
              placeholderTextColor={colors.textSecondary}
            />
          </>
        )}

        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholderTextColor={colors.textSecondary}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.submit} disabled={loading} onPress={submit} accessibilityRole="button">
          <Text style={styles.submitText}>{mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}</Text>
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: spacing(4) }}>
          <Text style={styles.switchText}>
            {mode === 'login' ? `${t('auth.noAccount')} ${t('auth.switchToRegister')}` : `${t('auth.hasAccount')} ${t('auth.switchToLogin')}`}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing(6), paddingVertical: spacing(10) },
    brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(2), marginBottom: spacing(8) },
    title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing(6) },
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
    error: { color: colors.danger, fontSize: 13, marginTop: spacing(3) },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
    switchText: { color: colors.primary, textAlign: 'center', fontSize: 13 },
  })
}
