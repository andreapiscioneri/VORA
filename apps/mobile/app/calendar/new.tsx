import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { EmployeePickerModal } from '../../components/EmployeePickerModal'
import { useEvents } from '../../hooks/useEvents'
import { useEmployees } from '../../hooks/useEmployees'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import { radius, spacing } from '../../constants/theme'
import { calendarEventInputSchema } from '@vora/shared/validation/event'
import { RECURRENCE_FREQUENCIES } from '@vora/shared/types/event'
import type { ThemeColors } from '../../constants/theme'
import type { CalendarEventInput, RecurrenceFrequency } from '@vora/shared/types/event'

function defaultStart() {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseLocalInputValue(text: string): string {
  const iso = text.trim().replace(' ', 'T')
  const d = new Date(iso.length === 16 ? `${iso}:00` : iso)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}

export default function NewEventScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const { create } = useEvents()
  const { employees } = useEmployees()
  const styles = makeStyles(colors)

  const start = defaultStart()
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startText, setStartText] = useState(toLocalInputValue(start))
  const [endText, setEndText] = useState(toLocalInputValue(end))
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('none')
  const [interval, setInterval] = useState('1')
  const [until, setUntil] = useState('')
  const [attendeeIds, setAttendeeIds] = useState<string[]>([])
  const [attendeePickerOpen, setAttendeePickerOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    haptics.press()
    setSaveError(null)

    const form = {
      title,
      description,
      startAt: parseLocalInputValue(startText),
      endAt: parseLocalInputValue(endText),
      allDay,
      location,
      contactId: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      recurrence: { frequency: recurrence, interval: Number.parseInt(interval, 10) || 1, until: until || null },
      attendeeIds,
    }
    const result = calendarEventInputSchema.safeParse(form)
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
      await create(result.data as CalendarEventInput)
      haptics.success()
      router.back()
    } catch {
      haptics.error()
      setSaveError(t('calendar.errors.save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailScreen title={t('calendar.form.newTitle')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('calendar.form.title')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />
          {errors.title ? <Text style={styles.error}>{errors.title}</Text> : null}

          <Text style={styles.label}>{t('calendar.form.allDay')}</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, allDay ? styles.chipActive : null]}
              onPress={() => {
                haptics.selection()
                setAllDay(true)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: allDay }}
            >
              <Text style={[styles.chipText, allDay ? styles.chipTextActive : null]}>{t('common.yes')}</Text>
            </Pressable>
            <Pressable
              style={[styles.chip, !allDay ? styles.chipActive : null]}
              onPress={() => {
                haptics.selection()
                setAllDay(false)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: !allDay }}
            >
              <Text style={[styles.chipText, !allDay ? styles.chipTextActive : null]}>{t('common.no')}</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t('calendar.form.startAt')}</Text>
          <TextInput
            style={styles.input}
            value={startText}
            onChangeText={setStartText}
            placeholder="YYYY-MM-DD HH:mm"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.startAt ? <Text style={styles.error}>{errors.startAt}</Text> : null}

          <Text style={styles.label}>{t('calendar.form.endAt')}</Text>
          <TextInput
            style={styles.input}
            value={endText}
            onChangeText={setEndText}
            placeholder="YYYY-MM-DD HH:mm"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.endAt ? <Text style={styles.error}>{errors.endAt}</Text> : null}

          <Text style={styles.label}>{t('calendar.form.location')}</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>{t('calendar.form.recurrence')}</Text>
          <View style={styles.chipRow}>
            {RECURRENCE_FREQUENCIES.map((f) => (
              <Pressable
                key={f}
                style={[styles.chip, recurrence === f ? styles.chipActive : null]}
                onPress={() => {
                  haptics.selection()
                  setRecurrence(f)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: recurrence === f }}
              >
                <Text style={[styles.chipText, recurrence === f ? styles.chipTextActive : null]}>{t(`calendar.recurrence.${f}`)}</Text>
              </Pressable>
            ))}
          </View>

          {recurrence !== 'none' ? (
            <View style={styles.recurrenceRow}>
              <View style={styles.recurrenceField}>
                <Text style={styles.label}>{t('calendar.form.repeatEvery')}</Text>
                <TextInput style={styles.input} value={interval} onChangeText={setInterval} keyboardType="number-pad" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={styles.recurrenceField}>
                <Text style={styles.label}>{t('calendar.form.repeatUntil')}</Text>
                <TextInput
                  style={styles.input}
                  value={until}
                  onChangeText={setUntil}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textSecondary}
                />
                {errors.until ? <Text style={styles.error}>{errors.until}</Text> : null}
              </View>
            </View>
          ) : null}

          <Text style={styles.label}>{t('calendar.form.attendees')}</Text>
          <View style={styles.chipRow}>
            {attendeeIds.map((id) => {
              const emp = employees.find((e) => e.id === id)
              if (!emp) return null
              return (
                <Pressable
                  key={id}
                  style={styles.attendeeChip}
                  onPress={() => {
                    haptics.selection()
                    setAttendeeIds((prev) => prev.filter((a) => a !== id))
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${emp.firstName} ${emp.lastName}`}
                >
                  <Text style={styles.attendeeChipText}>{emp.firstName} {emp.lastName}</Text>
                  <Icon name="x" size={12} color={colors.textPrimary} />
                </Pressable>
              )
            })}
            <Pressable
              style={styles.addAttendeeChip}
              onPress={() => {
                haptics.tap()
                setAttendeePickerOpen(true)
              }}
              accessibilityRole="button"
              accessibilityLabel={t('calendar.form.addAttendee')}
            >
              <Icon name="plus" size={14} color={colors.textPrimary} />
              <Text style={styles.attendeeChipText}>{t('calendar.form.addAttendee')}</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t('calendar.form.description')}</Text>
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
            <Text style={styles.submitText}>{saving ? t('calendar.form.saving') : t('calendar.form.save')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <EmployeePickerModal
        visible={attendeePickerOpen}
        onClose={() => setAttendeePickerOpen(false)}
        employees={employees.filter((e) => !attendeeIds.includes(e.id))}
        selectedId={null}
        hideNoneOption
        onSelect={(id) => {
          if (id) setAttendeeIds((prev) => [...prev, id])
        }}
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
    recurrenceRow: { flexDirection: 'row', gap: spacing(3) },
    recurrenceField: { flex: 1 },
    attendeeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(3),
    },
    addAttendeeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1),
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.full,
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(3),
    },
    attendeeChipText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), marginTop: spacing(6), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
  })
}
