import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { EmployeePickerModal } from '../../components/EmployeePickerModal'
import { useTickets } from '../../hooks/useTickets'
import { useEmployees } from '../../hooks/useEmployees'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { addTicketCommentSchema, ticketInputSchema } from '@vora/shared/validation/ticket'
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@vora/shared/types/ticket'
import type { ThemeColors } from '../../constants/theme'
import type { TicketInput, TicketPriority, TicketStatus } from '@vora/shared/types/ticket'

export default function EditTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { tickets, update, remove, addComment } = useTickets()
  const { employees } = useEmployees()
  const styles = makeStyles(colors)

  const ticket = tickets.find((tk) => tk.id === id)

  const [title, setTitle] = useState(ticket?.title ?? '')
  const [description, setDescription] = useState(ticket?.description ?? '')
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority ?? 'medium')
  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? 'open')
  const [assigneeId, setAssigneeId] = useState<string | null>(ticket?.assigneeId ?? null)
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [postingComment, setPostingComment] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!ticket) {
    return (
      <DetailScreen title={t('modules.helpdesk.title')}>
        <StateMessage text={t('modules.helpdesk.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      title,
      description,
      priority,
      status,
      contactId: ticket!.contactId,
      assigneeId,
      category: ticket!.category,
      slaDueAt: ticket!.slaDueAt,
      comments: ticket!.comments,
      attachments: ticket!.attachments,
    }
    const result = ticketInputSchema.safeParse(form)
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
      await update(id, result.data as TicketInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.helpdesk.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  async function submitComment() {
    haptics.press()
    setCommentError(null)

    const result = addTicketCommentSchema.safeParse({ body: commentBody })
    if (!result.success) {
      setCommentError(t(result.error.issues[0].message))
      haptics.error()
      return
    }

    setPostingComment(true)
    try {
      await addComment(id, result.data)
      setCommentBody('')
      haptics.success()
    } catch {
      haptics.error()
      setCommentError(t('modules.helpdesk.comments.errors.add'))
    } finally {
      setPostingComment(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.helpdesk.form.delete'), t('modules.helpdesk.deleteConfirm'), [
      { text: t('modules.helpdesk.form.cancel'), style: 'cancel' },
      {
        text: t('modules.helpdesk.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.helpdesk.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.helpdesk.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.helpdesk.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('modules.helpdesk.form.priority')}</Text>
          <View style={styles.chipRow}>
            {TICKET_PRIORITIES.map((p) => (
              <Pressable
                key={p}
                style={[styles.chip, priority === p ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setPriority(p)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: priority === p }}
              >
                <Text style={[styles.chipText, priority === p ? styles.chipTextActive : null]}>{t(`modules.helpdesk.priority.${p}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.helpdesk.form.status')}</Text>
          <View style={styles.chipRow}>
            {TICKET_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.helpdesk.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.helpdesk.form.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>{t('modules.helpdesk.form.assignee')}</Text>
          <Pressable
            style={styles.input}
            onPress={() => {
              haptics.tap()
              setAssigneePickerOpen(true)
            }}
            accessibilityRole="button"
          >
            <Text style={{ color: assigneeId ? colors.textPrimary : colors.textSecondary }}>
              {assigneeId
                ? (() => {
                    const a = employees.find((e) => e.id === assigneeId)
                    return a ? `${a.firstName} ${a.lastName}` : t('modules.employees.form.managerNone')
                  })()
                : t('modules.employees.form.managerNone')}
            </Text>
          </Pressable>

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.helpdesk.form.saving') : t('modules.helpdesk.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.helpdesk.form.delete')}</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>{t('modules.helpdesk.comments.title')}</Text>
          {ticket.comments.length === 0 ? (
            <Text style={styles.emptyText}>{t('modules.helpdesk.comments.empty')}</Text>
          ) : (
            ticket.comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentBody}>{c.body}</Text>
                <Text style={styles.commentDate}>{new Date(c.createdAt).toLocaleString()}</Text>
              </View>
            ))
          )}

          <TextInput
            style={[styles.input, styles.textArea, { marginTop: spacing(3) }]}
            value={commentBody}
            onChangeText={setCommentBody}
            placeholder={t('modules.helpdesk.comments.placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={2}
          />
          {commentError ? <Text style={styles.error}>{commentError}</Text> : null}
          <Pressable style={styles.addCommentButton} disabled={postingComment} onPress={submitComment} accessibilityRole="button">
            <Text style={styles.addCommentButtonText}>
              {postingComment ? t('modules.helpdesk.form.saving') : t('modules.helpdesk.comments.add')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <EmployeePickerModal
        visible={assigneePickerOpen}
        onClose={() => setAssigneePickerOpen(false)}
        employees={employees}
        selectedId={assigneeId}
        onSelect={setAssigneeId}
      />
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
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: spacing(6), marginBottom: spacing(2) },
    emptyText: { fontSize: 13, color: colors.textSecondary },
    commentRow: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(2) },
    commentBody: { fontSize: 14, color: colors.textPrimary },
    commentDate: { fontSize: 11, color: colors.textSecondary, marginTop: spacing(1) },
    addCommentButton: { backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(2), alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    addCommentButtonText: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  })
}
