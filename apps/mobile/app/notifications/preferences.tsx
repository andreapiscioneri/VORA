import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import type { ThemeColors } from '../../constants/theme'
import type { NotificationPreferences } from '@vora/shared/types/notification'

const CATEGORIES: (keyof NotificationPreferences)[] = [
  'messages',
  'urgentTasks',
  'appointments',
  'reminders',
  'aiActions',
  'approvals',
  'tickets',
  'deadlines',
]

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { preferences, loading, error, toggle } = useNotificationPreferences()

  return (
    <DetailScreen title={t('modules.notifications.title')} subtitle={t('modules.notifications.subtitle')}>
      {error ? (
        <StateMessage text={t('modules.notifications.error', { error })} />
      ) : loading ? (
        <StateMessage text={t('modules.notifications.loading')} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {CATEGORIES.map((key) => (
            <View key={key} style={styles.row} accessible accessibilityLabel={t(`modules.notifications.categories.${key}`)}>
              <Text style={styles.label}>{t(`modules.notifications.categories.${key}`)}</Text>
              <Switch
                value={preferences[key]}
                onValueChange={() => toggle(key)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </ScrollView>
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    label: { color: colors.textPrimary, fontSize: 15, fontWeight: '500', flex: 1, marginRight: spacing(3) },
  })
}
