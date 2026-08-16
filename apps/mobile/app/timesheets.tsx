import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useTimesheets } from '../hooks/useTimesheets'
import { DetailScreen, StateMessage } from '../components/Screen'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import type { ThemeColors } from '../constants/theme'
import type { TimesheetEntry } from '@vora/shared/types/timesheet'

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export default function TimesheetsScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { entries, loading, error, reload } = useTimesheets()

  return (
    <DetailScreen title={t('modules.timesheets.title')} subtitle={t('modules.timesheets.count', { count: entries.length })}>
      {error ? (
        <StateMessage text={t('modules.timesheets.error', { error })} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.timesheets.empty')} /> : null}
          renderItem={({ item }: { item: TimesheetEntry }) => (
            <View
              style={styles.row}
              accessible
              accessibilityLabel={`${item.description || formatDuration(item.durationMinutes)}, ${item.date}, ${formatDuration(item.durationMinutes)}, ${item.billable ? t('modules.timesheets.billable') : t('modules.timesheets.nonBillable')}`}
            >
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.description || formatDuration(item.durationMinutes)}
                </Text>
                <Text style={styles.subtext}>
                  {item.date} · {formatDuration(item.durationMinutes)}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.billable ? t('modules.timesheets.billable') : t('modules.timesheets.nonBillable')}</Text>
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
