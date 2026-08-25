import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useKnowledge } from '../../hooks/useKnowledge'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { knowledgeDocumentInputSchema } from '@vora/shared/validation/knowledge'
import type { ThemeColors } from '../../constants/theme'
import type { KnowledgeDocumentInput } from '@vora/shared/types/knowledge'

export default function EditKnowledgeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { documents, update, remove } = useKnowledge()
  const styles = makeStyles(colors)

  const document = documents.find((d) => d.id === id)

  const [title, setTitle] = useState(document?.title ?? '')
  const [content, setContent] = useState(document?.content ?? '')
  const [folder, setFolder] = useState(document?.folder ?? '')
  const [tagsText, setTagsText] = useState(document?.tags.join(', ') ?? '')
  const [favorite, setFavorite] = useState(document?.favorite ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!document) {
    return (
      <DetailScreen title={t('modules.knowledge.title')}>
        <StateMessage text={t('modules.knowledge.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      title,
      content,
      folder,
      tags: tagsText
        .split(',')
        .map((tg) => tg.trim())
        .filter(Boolean),
      favorite,
    }
    const result = knowledgeDocumentInputSchema.safeParse(form)
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
      await update(id, result.data as KnowledgeDocumentInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.knowledge.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.knowledge.form.delete'), t('modules.knowledge.deleteConfirm'), [
      { text: t('modules.knowledge.form.cancel'), style: 'cancel' },
      {
        text: t('modules.knowledge.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.knowledge.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.knowledge.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.knowledge.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('modules.knowledge.form.folder')}</Text>
          <TextInput style={styles.input} value={folder} onChangeText={setFolder} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.knowledge.form.tags')}</Text>
          <TextInput style={styles.input} value={tagsText} onChangeText={setTagsText} autoCapitalize="none" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.knowledge.form.content')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            placeholderTextColor={colors.textSecondary}
          />

          <Pressable
            style={styles.favoriteRow}
            onPress={() => {
              haptics.selection()
              setFavorite((f) => !f)
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: favorite }}
          >
            <Icon name="flag" size={18} color={favorite ? colors.warning : colors.textSecondary} />
            <Text style={styles.favoriteText}>{t('modules.knowledge.form.favorite')}</Text>
          </Pressable>

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.knowledge.form.saving') : t('modules.knowledge.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.knowledge.form.delete')}</Text>
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
    textArea: { textAlignVertical: 'top', minHeight: spacing(40) },
    error: { color: colors.danger, fontSize: 13, marginTop: spacing(1) },
    favoriteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(4) },
    favoriteText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
    deleteButton: { flexDirection: 'row', gap: spacing(2), alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(3), marginTop: spacing(4) },
    deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  })
}
