import { StyleSheet, Text, View } from 'react-native'
import { type IconName } from '../Icon'
import { GlassCard } from '../GlassCard'
import { GradientBadge } from '../GradientBadge'
import { useI18n } from '../../i18n'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing } from '../../constants/theme'
import type { ThemeColors } from '../../constants/theme'

const ITEMS: { key: string; icon: IconName }[] = [
  { key: 'crm', icon: 'users' },
  { key: 'calendar', icon: 'calendar' },
  { key: 'projects', icon: 'check-square' },
  { key: 'marketing', icon: 'megaphone' },
  { key: 'helpdesk', icon: 'life-buoy' },
  { key: 'people', icon: 'umbrella' },
]

export function ModulesSection() {
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{t('welcome.modules.eyebrow')}</Text>
      <Text style={styles.title}>{t('welcome.modules.title')}</Text>
      <Text style={styles.subtitle}>{t('welcome.modules.subtitle')}</Text>

      <View style={styles.list}>
        {ITEMS.map((item) => (
          <GlassCard key={item.key} style={styles.card}>
            <GradientBadge icon={item.icon} size={36} iconSize={17} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t(`welcome.modules.items.${item.key}.title`)}</Text>
              <Text style={styles.cardDescription}>{t(`welcome.modules.items.${item.key}.description`)}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Transparent on purpose: this section sits over the shared
    // AmbientBackground glow rendered once behind all post-hero sections
    // (see welcome.tsx) so the GlassCard rows below have something to
    // actually look "glass" against — mirrors the web landing's ambient
    // backdrop (layouts/public.vue).
    section: { paddingHorizontal: spacing(5), paddingVertical: spacing(10) },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    title: { color: colors.textPrimary, fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -1, marginTop: spacing(2) },
    subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing(3) },
    list: { marginTop: spacing(6), gap: spacing(3) },
    card: { flexDirection: 'row', gap: spacing(3) },
    cardText: { flex: 1, gap: spacing(1) },
    cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    cardDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  })
}
