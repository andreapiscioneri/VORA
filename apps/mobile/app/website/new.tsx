import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { useMicroSites } from '../../hooks/useMicroSites'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { microSiteInputSchema } from '@vora/shared/validation/microsite'
import { ApiError } from '../../lib/api'
import type { ThemeColors } from '../../constants/theme'
import type { MicroSiteInput } from '@vora/shared/types/microsite'

export default function NewMicroSiteScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useMicroSites()
  const styles = makeStyles(colors)

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [about, setAbout] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [accentColor, setAccentColor] = useState('#39FF14')
  const [published, setPublished] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { slug, name, tagline, about, contactEmail, accentColor, published }
    const result = microSiteInputSchema.safeParse(form)
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
      await create(result.data as MicroSiteInput)
      haptics.success()
      router.back()
    } catch (e) {
      haptics.error()
      const fieldErrors = e instanceof ApiError ? (e.data as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors : undefined
      if (fieldErrors?.slug) {
        setErrors({ slug: t(fieldErrors.slug[0]) })
      } else {
        setSaveError(t('modules.website.errors.save'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('modules.website.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.website.form.slug')}</Text>
          <TextInput
            style={styles.input}
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="my-company"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.hint}>{t('modules.website.form.slugHint', { slug: slug || '…' })}</Text>
          {errors.slug ? <Text style={styles.error}>{errors.slug}</Text> : null}

          <Text style={styles.label}>{t('modules.website.form.name')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textSecondary} />
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

          <Text style={styles.label}>{t('modules.website.form.tagline')}</Text>
          <TextInput style={styles.input} value={tagline} onChangeText={setTagline} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.website.form.about')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={about}
            onChangeText={setAbout}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.website.form.contactEmail')}</Text>
          <TextInput
            style={styles.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.contactEmail ? <Text style={styles.error}>{errors.contactEmail}</Text> : null}

          <Text style={styles.label}>{t('modules.website.form.accentColor')}</Text>
          <View style={styles.colorRow}>
            <View style={[styles.swatch, { backgroundColor: /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : colors.border }]} />
            <TextInput
              style={[styles.input, styles.colorInput]}
              value={accentColor}
              onChangeText={setAccentColor}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          {errors.accentColor ? <Text style={styles.error}>{errors.accentColor}</Text> : null}

          <Pressable
            style={styles.publishRow}
            onPress={() => {
              haptics.selection()
              setPublished((p) => !p)
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: published }}
          >
            <View style={[styles.checkbox, published ? { backgroundColor: colors.primary, borderColor: colors.primary } : null]} />
            <Text style={styles.publishLabel}>{t('modules.website.form.published')}</Text>
          </Pressable>

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.website.form.saving') : t('modules.website.form.save')}</Text>
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
    hint: { fontSize: 11, color: colors.textSecondary, marginTop: spacing(1) },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(3),
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    textArea: { textAlignVertical: 'top', minHeight: spacing(24) },
    error: { color: colors.danger, fontSize: 13, marginTop: spacing(1) },
    colorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    colorInput: { flex: 1 },
    swatch: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    publishRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginTop: spacing(5) },
    checkbox: { width: 20, height: 20, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border },
    publishLabel: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
  })
}
