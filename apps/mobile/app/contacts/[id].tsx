import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useContacts } from '../../hooks/useContacts'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { contactInputSchema } from '@vora/shared/validation/contact'
import { CONTACT_STATUSES } from '@vora/shared/types/contact'
import type { ThemeColors } from '../../constants/theme'
import type { ContactInput, ContactStatus } from '@vora/shared/types/contact'

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { contacts, update, remove } = useContacts()
  const styles = makeStyles(colors)

  const contact = contacts.find((c) => c.id === id)

  const [firstName, setFirstName] = useState(contact?.firstName ?? '')
  const [lastName, setLastName] = useState(contact?.lastName ?? '')
  const [company, setCompany] = useState(contact?.company ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [status, setStatus] = useState<ContactStatus>(contact?.status ?? 'lead')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (!contact) {
    return (
      <DetailScreen title={t('modules.contacts.title')}>
        <StateMessage text={t('modules.contacts.empty')} />
      </DetailScreen>
    )
  }

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = { firstName, lastName, company, email, phone, notes, status }
    const result = contactInputSchema.safeParse(form)
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
      await update(id, result.data as ContactInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('modules.contacts.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete() {
    haptics.warning()
    Alert.alert(t('modules.contacts.form.delete'), t('modules.contacts.deleteConfirm'), [
      { text: t('modules.contacts.form.cancel'), style: 'cancel' },
      {
        text: t('modules.contacts.form.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(id)
            haptics.success()
            router.back()
          } catch {
            haptics.error()
            setSaveError(t('modules.contacts.errors.delete'))
          }
        },
      },
    ])
  }

  return (
    <DetailScreen title={t('modules.contacts.form.editTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('modules.contacts.form.firstName')}</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholderTextColor={colors.textSecondary} />
          {errors.firstName ? <Text style={styles.error}>{errors.firstName}</Text> : null}

          <Text style={styles.label}>{t('modules.contacts.form.lastName')}</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholderTextColor={colors.textSecondary} />
          {errors.lastName ? <Text style={styles.error}>{errors.lastName}</Text> : null}

          <Text style={styles.label}>{t('modules.contacts.form.company')}</Text>
          <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('modules.contacts.form.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

          <Text style={styles.label}>{t('modules.contacts.form.phone')}</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textSecondary} />
          {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

          <Text style={styles.label}>{t('modules.contacts.form.status')}</Text>
          <View style={styles.chipRow}>
            {CONTACT_STATUSES.map((s) => (
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
                <Text style={[styles.chipText, status === s ? styles.chipTextActive : null]}>{t(`modules.contacts.status.${s}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('modules.contacts.form.notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.contacts.form.saving') : t('modules.contacts.form.save')}</Text>
          </Pressable>

          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button">
            <Icon name="trash" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>{t('modules.contacts.form.delete')}</Text>
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
