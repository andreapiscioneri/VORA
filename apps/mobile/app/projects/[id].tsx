import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useProjects } from '../../hooks/useProjects'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { projectInputSchema } from '@vora/shared/validation/project'
import { addProjectDocumentSchema, addProjectMilestoneSchema } from '@vora/shared/validation/project'
import { PROJECT_STATUSES } from '@vora/shared/types/project'
import type { ThemeColors } from '../../constants/theme'
import type { ProjectInput, ProjectStatus } from '@vora/shared/types/project'

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { projects, update, remove, addDocument, addComment, addMilestone, toggleMilestone } = useProjects()
  const styles = makeStyles(colors)

  const project = projects.find((p) => p.id === id)

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'active')
  const [budget, setBudget] = useState(project ? String(project.budget) : '')
  const [dueDate, setDueDate] = useState(project?.dueDate ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [docTitle, setDocTitle] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [docError, setDocError] = useState<string | null>(null)
  const [addingDoc, setAddingDoc] = useState(false)

  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDueDate, setMilestoneDueDate] = useState('')
  const [milestoneError, setMilestoneError] = useState<string | null>(null)
  const [addingMilestone, setAddingMilestone] = useState(false)

  const [commentBody, setCommentBody] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [addingComment, setAddingComment] = useState(false)

  if (!project) {
    return (
      <DetailScreen title={t('modules.projects.title')}>
        <StateMessage text={t('modules.projects.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      name,
      description,
      status,
      budget,
      dueDate: dueDate || null,
      contactId: project!.contactId,
      startDate: project!.startDate,
      documents: project!.documents,
      discussion: project!.discussion,
      milestones: project!.milestones,
    }
    const result = projectInputSchema.safeParse(form)
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
      await update(id, result.data as ProjectInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.projects.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  async function submitDocument() {
    haptics.press()
    setDocError(null)
    const result = addProjectDocumentSchema.safeParse({ title: docTitle, url: docUrl })
    if (!result.success) {
      setDocError(t(result.error.issues[0].message))
      haptics.error()
      return
    }
    setAddingDoc(true)
    try {
      await addDocument(id, result.data)
      setDocTitle('')
      setDocUrl('')
      haptics.success()
    } catch {
      haptics.error()
      setDocError(t('modules.projects.documents.errors.add'))
    } finally {
      setAddingDoc(false)
    }
  }

  async function submitMilestone() {
    haptics.press()
    setMilestoneError(null)
    const result = addProjectMilestoneSchema.safeParse({ title: milestoneTitle, dueDate: milestoneDueDate || null })
    if (!result.success) {
      setMilestoneError(t(result.error.issues[0].message))
      haptics.error()
      return
    }
    setAddingMilestone(true)
    try {
      await addMilestone(id, result.data)
      setMilestoneTitle('')
      setMilestoneDueDate('')
      haptics.success()
    } catch {
      haptics.error()
      setMilestoneError(t('modules.projects.milestones.errors.add'))
    } finally {
      setAddingMilestone(false)
    }
  }

  async function onToggleMilestone(milestoneId: string) {
    haptics.selection()
    try {
      await toggleMilestone(id, milestoneId)
    } catch {
      haptics.error()
    }
  }

  async function submitComment() {
    haptics.press()
    setCommentError(null)
    if (!commentBody.trim()) {
      setCommentError(t('validation.required'))
      haptics.error()
      return
    }
    setAddingComment(true)
    try {
      await addComment(id, { body: commentBody.trim() })
      setCommentBody('')
      haptics.success()
    } catch {
      haptics.error()
      setCommentError(t('modules.projects.discussion.errors.add'))
    } finally {
      setAddingComment(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.projects.form.delete'), t('modules.projects.deleteConfirm'), [
      { text: t('modules.projects.form.cancel'), style: 'cancel' },
      {
        text: t('modules.projects.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.projects.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.projects.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.projects.form.name')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textSecondary} />
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

          <Text style={styles.label}>{t('modules.projects.form.status')}</Text>
          <View style={styles.chipRow}>
            {PROJECT_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.projects.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.projects.form.budget')}</Text>
          <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.projects.form.dueDate')}</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.projects.form.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.projects.form.saving') : t('modules.projects.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.projects.form.delete')}</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>{t('modules.projects.milestones.title')}</Text>
          {project.milestones.length === 0 ? (
            <Text style={styles.emptyText}>{t('modules.projects.milestones.empty')}</Text>
          ) : (
            project.milestones.map((m) => (
              <Pressable key={m.id} style={styles.listRow} onPress={() => onToggleMilestone(m.id)} accessibilityRole="button">
                <Icon name="check-square" size={18} color={m.status === 'completed' ? colors.primary : colors.textSecondary} />
                <View style={styles.listRowMain}>
                  <Text style={[styles.listRowTitle, m.status === 'completed' ? styles.listRowTitleDone : null]}>{m.title}</Text>
                  {m.dueDate ? <Text style={styles.listRowSubtext}>{m.dueDate}</Text> : null}
                </View>
              </Pressable>
            ))
          )}
          <Text style={[styles.label, { marginTop: spacing(3) }]}>{t('modules.projects.milestones.form.title')}</Text>
          <TextInput style={styles.input} value={milestoneTitle} onChangeText={setMilestoneTitle} placeholderTextColor={colors.textSecondary} />
          <Text style={styles.label}>{t('modules.projects.milestones.form.dueDate')}</Text>
          <TextInput
            style={styles.input}
            value={milestoneDueDate}
            onChangeText={setMilestoneDueDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          {milestoneError ? <Text style={styles.error}>{milestoneError}</Text> : null}
          <Pressable style={styles.addButton} disabled={addingMilestone} onPress={submitMilestone} accessibilityRole="button">
            <Text style={styles.addButtonText}>{t('modules.projects.milestones.form.add')}</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>{t('modules.projects.documents.title')}</Text>
          {project.documents.length === 0 ? (
            <Text style={styles.emptyText}>{t('modules.projects.documents.empty')}</Text>
          ) : (
            project.documents.map((d) => (
              <Pressable key={d.id} style={styles.listRow} onPress={() => Linking.openURL(d.url)} accessibilityRole="button">
                <Icon name="external-link" size={18} color={colors.textSecondary} />
                <View style={styles.listRowMain}>
                  <Text style={styles.listRowTitle}>{d.title}</Text>
                </View>
              </Pressable>
            ))
          )}
          <Text style={[styles.label, { marginTop: spacing(3) }]}>{t('modules.projects.documents.form.title')}</Text>
          <TextInput style={styles.input} value={docTitle} onChangeText={setDocTitle} placeholderTextColor={colors.textSecondary} />
          <Text style={styles.label}>{t('modules.projects.documents.form.url')}</Text>
          <TextInput
            style={styles.input}
            value={docUrl}
            onChangeText={setDocUrl}
            placeholder="https://..."
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          {docError ? <Text style={styles.error}>{docError}</Text> : null}
          <Pressable style={styles.addButton} disabled={addingDoc} onPress={submitDocument} accessibilityRole="button">
            <Text style={styles.addButtonText}>{t('modules.projects.documents.form.add')}</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>{t('modules.projects.discussion.title')}</Text>
          {project.discussion.length === 0 ? (
            <Text style={styles.emptyText}>{t('modules.projects.discussion.empty')}</Text>
          ) : (
            project.discussion.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>{c.authorName}</Text>
                <Text style={styles.commentBody}>{c.body}</Text>
                <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleString('it-IT')}</Text>
              </View>
            ))
          )}
          <TextInput
            style={[styles.input, styles.textArea, { marginTop: spacing(3), minHeight: spacing(12) }]}
            value={commentBody}
            onChangeText={setCommentBody}
            placeholder={t('modules.projects.discussion.placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={2}
          />
          {commentError ? <Text style={styles.error}>{commentError}</Text> : null}
          <Pressable style={styles.addButton} disabled={addingComment} onPress={submitComment} accessibilityRole="button">
            <Text style={styles.addButtonText}>{addingComment ? t('modules.projects.form.saving') : t('modules.projects.discussion.add')}</Text>
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
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: spacing(7), marginBottom: spacing(2) },
    emptyText: { fontSize: 13, color: colors.textSecondary },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(3),
      marginBottom: spacing(2),
    },
    listRowMain: { flex: 1 },
    listRowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    listRowTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
    listRowSubtext: { fontSize: 12, color: colors.textSecondary, marginTop: spacing(1) },
    addButton: { backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(2), alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    addButtonText: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
    commentRow: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(2) },
    commentAuthor: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
    commentBody: { fontSize: 14, color: colors.textPrimary, marginTop: spacing(1) },
    commentDate: { fontSize: 11, color: colors.textSecondary, marginTop: spacing(1) },
  })
}
