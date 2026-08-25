import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useSocialPosts } from '../../hooks/useSocialPosts'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { socialPostInputSchema } from '@vora/shared/validation/social-post'
import { SOCIAL_PLATFORMS, SOCIAL_POST_STATUSES } from '@vora/shared/types/social-post'
import type { ThemeColors } from '../../constants/theme'
import type { SocialPlatform, SocialPostInput, SocialPostStatus } from '@vora/shared/types/social-post'

export default function EditSocialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { posts, update, remove } = useSocialPosts()
  const styles = makeStyles(colors)

  const post = posts.find((p) => p.id === id)

  const [content, setContent] = useState(post?.content ?? '')
  const [platform, setPlatform] = useState<SocialPlatform>(post?.platform ?? 'instagram')
  const [status, setStatus] = useState<SocialPostStatus>(post?.status ?? 'draft')
  const [scheduledAt, setScheduledAt] = useState(post?.scheduledAt ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!post) {
    return (
      <DetailScreen title={t('modules.social.title')}>
        <StateMessage text={t('modules.social.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { content, platform, status, scheduledAt: scheduledAt || null }
    const result = socialPostInputSchema.safeParse(form)
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
      await update(id, result.data as SocialPostInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.social.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.social.form.delete'), t('modules.social.deleteConfirm'), [
      { text: t('modules.social.form.cancel'), style: 'cancel' },
      {
        text: t('modules.social.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.social.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.social.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.social.form.content')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textSecondary}
          />
          {errors.content ? <Text style={styles.error}>{errors.content}</Text> : null}

          <Text style={styles.label}>{t('modules.social.form.platform')}</Text>
          <View style={styles.chipRow}>
            {SOCIAL_PLATFORMS.map((p) => (
              <Pressable
                key={p}
                style={[styles.chip, platform === p ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setPlatform(p)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: platform === p }}
              >
                <Text style={[styles.chipText, platform === p ? styles.chipTextActive : null]}>{t(`modules.social.platform.${p}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.social.form.status')}</Text>
          <View style={styles.chipRow}>
            {SOCIAL_POST_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.social.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.social.form.scheduledAt')}</Text>
          <TextInput
            style={styles.input}
            value={scheduledAt ?? ''}
            onChangeText={setScheduledAt}
            placeholder="YYYY-MM-DDTHH:mm"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.social.form.saving') : t('modules.social.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.social.form.delete')}</Text>
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
