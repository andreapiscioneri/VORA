import { StyleSheet, Text, View } from 'react-native'
import { Icon, type IconName } from '../Icon'
import { useI18n } from '../../i18n'
import { useTheme } from '../../contexts/ThemeContext'
import { radius, spacing } from '../../constants/theme'
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
          <View key={item.key} style={styles.card}>
            <View style={styles.iconWrap}>
              <Icon name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{t(`welcome.modules.items.${item.key}.title`)}</Text>
              <Text style={styles.cardDescription}>{t(`welcome.modules.items.${item.key}.description`)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: { paddingHorizontal: spacing(5), paddingVertical: spacing(10), backgroundColor: colors.background },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    title: { color: colors.textPrimary, fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -1, marginTop: spacing(2) },
    subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing(3) },
    list: { marginTop: spacing(6), gap: spacing(3) },
    card: {
      flexDirection: 'row',
      gap: spacing(3),
      padding: spacing(4),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardText: { flex: 1, gap: spacing(1) },
    cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    cardDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  })
}
