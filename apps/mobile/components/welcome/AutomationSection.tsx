import { Platform, StyleSheet, Text, View } from 'react-native'
import { useI18n } from '../../i18n'
import { radius, spacing } from '../../constants/theme'

const MONO = { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }

const KEYS = ['contact', 'appointment', 'invoice'] as const

export function AutomationSection() {
  const { t } = useI18n()

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{t('welcome.automation.eyebrow')}</Text>
      <Text style={styles.title}>{t('welcome.automation.title')}</Text>
      <Text style={styles.subtitle}>{t('welcome.automation.subtitle')}</Text>

      <View style={styles.list}>
        {KEYS.map((key) => (
          <View key={key} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabelPrimary}>{t('welcome.automation.labels.trigger')}</Text>
              <Text style={styles.rowValue}>{t(`welcome.automation.items.${key}.trigger`)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('welcome.automation.labels.condition')}</Text>
              <Text style={styles.rowValueMuted}>{t(`welcome.automation.items.${key}.condition`)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('welcome.automation.labels.action')}</Text>
              <Text style={styles.rowValueMuted}>{t(`welcome.automation.items.${key}.action`)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing(5), paddingVertical: spacing(10) },
  eyebrow: { color: '#39FF14', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', ...MONO },
  title: { color: '#FFFFFF', fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -1, marginTop: spacing(2), ...MONO },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginTop: spacing(3), ...MONO },
  list: { marginTop: spacing(6), gap: spacing(3) },
  card: {
    gap: spacing(2.5),
    padding: spacing(4),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing(2) },
  rowLabelPrimary: { color: '#39FF14', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', minWidth: 72, ...MONO },
  rowLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', minWidth: 72, ...MONO },
  rowValue: { flex: 1, color: '#FFFFFF', fontSize: 13, lineHeight: 18, ...MONO },
  rowValueMuted: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18, ...MONO },
})
