import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon, type IconName } from '../Icon'
import { useI18n } from '../../i18n'
import { radius, spacing } from '../../constants/theme'

const TAB_KEYS = ['crm', 'calendar', 'automation', 'projects'] as const
type TabKey = (typeof TAB_KEYS)[number]

const TAB_ICONS: Record<TabKey, IconName> = {
  crm: 'users',
  calendar: 'calendar',
  automation: 'sparkles',
  projects: 'check-square',
}

export function DemoSection({ onCta }: { onCta: () => void }) {
  const { t } = useI18n()
  const [active, setActive] = useState<TabKey>('crm')

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{t('welcome.demo.eyebrow')}</Text>
      <Text style={styles.title}>{t('welcome.demo.title')}</Text>
      <Text style={styles.subtitle}>{t('welcome.demo.subtitle')}</Text>

      <View style={styles.tabRow}>
        {TAB_KEYS.map((key) => {
          const isActive = key === active
          return (
            <Pressable key={key} onPress={() => setActive(key)} style={[styles.tab, isActive && styles.tabActive]}>
              <Icon name={TAB_ICONS[key]} size={14} color={isActive ? '#0A0A0A' : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t(`welcome.demo.tabs.${key}.label`)}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.preview}>
        <View style={styles.previewHeader}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.previewBody}>
          <View style={styles.previewIconRow}>
            <View style={styles.previewIconWrap}>
              <Icon name={TAB_ICONS[active]} size={18} color="#39FF14" />
            </View>
            <View style={styles.previewBars}>
              <View style={[styles.bar, { width: '55%' }]} />
              <View style={[styles.barThin, { width: '30%' }]} />
            </View>
          </View>
          <View style={styles.previewBarsFull}>
            <View style={styles.barFull} />
            <View style={[styles.barFull, { width: '80%' }]} />
            <View style={[styles.barFull, { width: '60%' }]} />
          </View>
          <Text style={styles.previewCaption}>{t(`welcome.demo.tabs.${active}.caption`)}</Text>
        </View>
      </View>

      <Pressable onPress={onCta} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
        <Text style={styles.ctaText}>{t('welcome.demo.ctaTry')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing(5), paddingVertical: spacing(10), paddingBottom: spacing(16) },
  eyebrow: { color: '#39FF14', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -1, marginTop: spacing(2) },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginTop: spacing(3) },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(6) },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: { backgroundColor: '#39FF14' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#0A0A0A' },
  preview: {
    marginTop: spacing(5),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    gap: spacing(1.5),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.2)' },
  previewBody: { padding: spacing(5) },
  previewIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(4) },
  previewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(57,255,20,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBars: { flex: 1, gap: spacing(1.5) },
  bar: { height: 9, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.15)' },
  barThin: { height: 7, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.1)' },
  previewBarsFull: { gap: spacing(2) },
  barFull: { height: 9, width: '100%', borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.1)' },
  previewCaption: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginTop: spacing(4) },
  cta: {
    marginTop: spacing(6),
    alignSelf: 'flex-start',
    backgroundColor: '#39FF14',
    paddingHorizontal: spacing(7),
    paddingVertical: spacing(4),
    borderRadius: radius.full,
  },
  ctaText: { color: '#0A0A0A', fontSize: 15, fontWeight: '700' },
  pressed: { transform: [{ scale: 0.96 }] },
})
