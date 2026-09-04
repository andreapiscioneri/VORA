import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTimesheets } from '../../hooks/useTimesheets'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { TimesheetEntry } from '@vora/shared/types/timesheet'

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export default function TimesheetsScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { entries, loading, loadingMore, error, hasMore, reload, loadMore } = useTimesheets()

  return (
    <DetailScreen
      title={t('modules.timesheets.title')}
      subtitle={t('modules.timesheets.count', { count: entries.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/timesheets/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.timesheets.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={t('modules.timesheets.error', { error })} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.timesheets.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: TimesheetEntry }) => (
            <Pressable
              onPress={() => {
                haptics.tap()
                router.push(`/timesheets/${item.id}`)
              }}
              style={styles.row}
              accessibilityRole="button"
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
            </Pressable>
          )}
        />
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addButton: { padding: spacing(1) },
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
    footer: { paddingVertical: spacing(4) },
  })
}
