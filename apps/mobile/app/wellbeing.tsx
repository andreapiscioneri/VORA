import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native'
import { useWellbeing } from '../hooks/useWellbeing'
import { DetailScreen, StateMessage } from '../components/Screen'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import type { ThemeColors } from '../constants/theme'
import type { WellbeingScaleValue } from '@vora/shared/types/wellbeing'

const SCALE: WellbeingScaleValue[] = [1, 2, 3, 4, 5]

export default function WellbeingScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { checkIns, loading, error, saveCheckIn, todayCheckIn, today } = useWellbeing()

  const [mood, setMood] = useState<WellbeingScaleValue>(todayCheckIn?.mood ?? 3)
  const [energy, setEnergy] = useState<WellbeingScaleValue>(todayCheckIn?.energy ?? 3)
  const [stress, setStress] = useState<WellbeingScaleValue>(todayCheckIn?.stress ?? 3)
  const [note, setNote] = useState(todayCheckIn?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function submit() {
    setSaving(true)
    setSaved(false)
    try {
      await saveCheckIn({ date: today, mood, energy, stress, note })
      setSaved(true)
      haptics.success()
    } finally {
      setSaving(false)
    }
  }

  function ScaleRow({ label, value, onChange }: { label: string; value: WellbeingScaleValue; onChange: (v: WellbeingScaleValue) => void }) {
    return (
      <View style={styles.scaleGroup}>
        <Text style={styles.scaleLabel}>{label}</Text>
        <View style={styles.scaleRow}>
          {SCALE.map((v) => (
            <Pressable
              key={v}
              style={[styles.scaleButton, value === v ? styles.scaleButtonActive : null]}
              onPress={() => {
                haptics.selection()
                onChange(v)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: value === v }}
              accessibilityLabel={`${label} ${v}`}
            >
              <Text style={[styles.scaleButtonText, value === v ? styles.scaleButtonTextActive : null]}>{v}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    )
  }

  return (
    <DetailScreen title={t('modules.wellbeing.title')} subtitle={t('modules.wellbeing.subtitle')}>
      {error ? (
        <StateMessage text={t('modules.wellbeing.error', { error })} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>{t('modules.wellbeing.disclaimer')}</Text>
          </View>

          <ScaleRow label={t('modules.wellbeing.mood')} value={mood} onChange={setMood} />
          <ScaleRow label={t('modules.wellbeing.energy')} value={energy} onChange={setEnergy} />
          <ScaleRow label={t('modules.wellbeing.stress')} value={stress} onChange={setStress} />

          <Text style={styles.scaleLabel}>{t('modules.wellbeing.note')}</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            placeholder={t('modules.wellbeing.notePlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />

          <Pressable style={styles.submit} disabled={saving} onPress={submit} accessibilityRole="button">
            <Text style={styles.submitText}>{saving ? t('modules.wellbeing.saving') : t('modules.wellbeing.save')}</Text>
          </Pressable>
          {saved ? <Text style={styles.saved}>{t('modules.wellbeing.saved')}</Text> : null}

          {checkIns.length > 0 ? (
            <>
              <Text style={[styles.scaleLabel, { marginTop: spacing(6) }]}>{t('modules.wellbeing.history')}</Text>
              {checkIns.slice(0, 10).map((c) => (
                <View key={c.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{c.date}</Text>
                  <Text style={styles.historyText}>
                    {t('modules.wellbeing.mood')} {c.mood} · {t('modules.wellbeing.energy')} {c.energy} · {t('modules.wellbeing.stress')} {c.stress}
                  </Text>
                </View>
              ))}
            </>
          ) : !loading ? (
            <StateMessage text={t('modules.wellbeing.empty')} />
          ) : null}
        </ScrollView>
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    disclaimer: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(5),
      borderWidth: 1,
      borderColor: colors.border,
    },
    disclaimerText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
    scaleGroup: { marginBottom: spacing(5) },
    scaleLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(2) },
    scaleRow: { flexDirection: 'row', gap: spacing(2) },
    scaleButton: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scaleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    scaleButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
    scaleButtonTextActive: { color: '#0A0A0A' },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(3),
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      textAlignVertical: 'top',
      minHeight: 80,
      marginBottom: spacing(5),
    },
    submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing(3), alignItems: 'center' },
    submitText: { color: '#0A0A0A', fontWeight: '700', fontSize: 15 },
    saved: { color: colors.primary, fontSize: 13, marginTop: spacing(2), textAlign: 'center' },
    historyRow: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(2) },
    historyDate: { color: colors.textSecondary, fontSize: 12 },
    historyText: { color: colors.textPrimary, fontSize: 13, marginTop: spacing(1) },
  })
}
