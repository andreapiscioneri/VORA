import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useOpportunities } from '../hooks/useOpportunities'
import { DetailScreen, StateMessage } from '../components/Screen'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import type { ThemeColors } from '../constants/theme'
import type { Opportunity } from '@vora/shared/types/opportunity'

function formatValue(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${value} ${currency}`
  }
}

export default function CrmScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { opportunities, loading, error, reload } = useOpportunities()

  return (
    <DetailScreen title={t('modules.crm.title')} subtitle={t('modules.crm.count', { count: opportunities.length })}>
      {error ? (
        <StateMessage text={t('modules.crm.error', { error })} />
      ) : (
        <FlatList
          data={opportunities}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.crm.empty')} /> : null}
          renderItem={({ item }: { item: Opportunity }) => (
            <View
              style={styles.row}
              accessible
              accessibilityLabel={`${item.title}, ${item.company}, ${formatValue(item.value, item.currency)}, ${t(`modules.crm.stage.${item.stage}`)}`}
            >
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.subtext} numberOfLines={1}>
                  {item.company ? `${item.company} · ` : ''}
                  {formatValue(item.value, item.currency)}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(`modules.crm.stage.${item.stage}`)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    rowMain: { flex: 1, marginRight: spacing(3) },
    title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
    subtext: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    badge: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(3) },
    badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
  })
}
