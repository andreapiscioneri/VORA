import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { BrandMark } from '../components/BrandMark'
import { Wordmark } from '../components/Wordmark'
import { useAuth, ApiError } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import { radius, spacing } from '../constants/theme'
import type { ThemeColors } from '../constants/theme'

// Google's official four-color "G" mark, same path data as the web login
// page's inline SVG (apps/web/pages/login.vue) — kept visually identical.
function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <Path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84Z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </Svg>
  )
}

export default function LoginScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const { login, loginWithGoogle, register } = useAuth()
  const router = useRouter()
  const styles = makeStyles(colors)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
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
      haptics.error()
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

  async function submitGoogle() {
    setGoogleLoading(true)
    setError(null)
    try {
      await loginWithGoogle()
      router.replace('/')
    } catch {
      haptics.error()
      setError(t('auth.oauthFailed'))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <BrandMark size={32} />
          <Wordmark size={28} color={colors.textPrimary} />
        </View>

        {mode === 'register' && <Text style={styles.title}>{t('auth.registerTitle')}</Text>}

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

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable style={styles.googleButton} disabled={googleLoading} onPress={submitGoogle} accessibilityRole="button">
          <GoogleLogo />
          <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
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
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginTop: spacing(5), marginBottom: spacing(1) },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textSecondary, fontSize: 12 },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing(3),
      marginTop: spacing(4),
    },
    googleButtonText: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
    switchText: { color: colors.primary, textAlign: 'center', fontSize: 13 },
  })
}
