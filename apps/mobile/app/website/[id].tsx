import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useMicroSites } from '../../hooks/useMicroSites'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { microSiteInputSchema } from '@vora/shared/validation/microsite'
import { ApiError } from '../../lib/api'
import type { ThemeColors } from '../../constants/theme'
import type { MicroSiteInput } from '@vora/shared/types/microsite'

export default function EditMicroSiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { sites, update, remove } = useMicroSites()
  const styles = makeStyles(colors)

  const site = sites.find((s) => s.id === id)

  const [slug, setSlug] = useState(site?.slug ?? '')
  const [name, setName] = useState(site?.name ?? '')
  const [tagline, setTagline] = useState(site?.tagline ?? '')
  const [about, setAbout] = useState(site?.about ?? '')
  const [contactEmail, setContactEmail] = useState(site?.contactEmail ?? '')
  const [accentColor, setAccentColor] = useState(site?.accentColor ?? '#39FF14')
  const [published, setPublished] = useState(site?.published ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!site) {
    return (
      <DetailScreen title={t('modules.website.title')}>
        <StateMessage text={t('modules.website.empty')} />
      </DetailScreen>
    )
  }

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
      await update(id, result.data as MicroSiteInput)
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

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.website.form.delete'), t('modules.website.deleteConfirm'), [
      { text: t('modules.website.form.cancel'), style: 'cancel' },
      {
        text: t('modules.website.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.website.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.website.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {site.published ? (
            <Pressable
              style={styles.viewLiveRow}
              onPress={() => Linking.openURL(`https://vora-gestionale.netlify.app/site/${site.slug}`)}
              accessibilityRole="link"
            >
              <Icon name="external-link" size={16} color={colors.primary} />
              <Text style={styles.viewLiveText}>{t('modules.website.viewLive')}</Text>
            </Pressable>
          ) : null}

          <Text style={styles.label}>{t('modules.website.form.slug')}</Text>
          <TextInput
            style={styles.input}
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
            autoCorrect={false}
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

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.website.form.delete')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    viewLiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(3),
      marginBottom: spacing(2),
    },
    viewLiveText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
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
    deleteButton: { flexDirection: 'row', gap: spacing(2), alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(3), marginTop: spacing(4) },
    deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  })
}
