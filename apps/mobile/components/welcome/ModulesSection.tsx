import { StyleSheet, Text, View } from 'react-native'
import { Icon, type IconName } from '../Icon'
import { useI18n } from '../../i18n'
import { radius, spacing } from '../../constants/theme'

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

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{t('welcome.modules.eyebrow')}</Text>
      <Text style={styles.title}>{t('welcome.modules.title')}</Text>
      <Text style={styles.subtitle}>{t('welcome.modules.subtitle')}</Text>

      <View style={styles.list}>
        {ITEMS.map((item) => (
          <View key={item.key} style={styles.card}>
            <View style={styles.iconWrap}>
              <Icon name={item.icon} size={18} color="#39FF14" />
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

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing(5), paddingVertical: spacing(10) },
  eyebrow: { color: '#39FF14', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -1, marginTop: spacing(2) },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginTop: spacing(3) },
  list: { marginTop: spacing(6), gap: spacing(3) },
  card: {
    flexDirection: 'row',
    gap: spacing(3),
    padding: spacing(4),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(57,255,20,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: spacing(1) },
  cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cardDescription: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 18 },
})
