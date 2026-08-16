import { useCallback } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTasks } from '../../hooks/useTasks'
import { useInbox } from '../../hooks/useInbox'
import { useEvents } from '../../hooks/useEvents'
import { Screen } from '../../components/Screen'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import type { ThemeColors } from '../../constants/theme'

function StatCard({ label, value, colors }: { label: string; value: number | string; colors: ThemeColors }) {
  const styles = makeStyles(colors)
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { tasks, loading: tasksLoading, error: tasksError, reload: reloadTasks } = useTasks()
  const { items: comms, loading: inboxLoading, error: inboxError, reload: reloadInbox } = useInbox()
  const { events, loading: eventsLoading, error: eventsError, reload: reloadEvents } = useEvents()

  const loading = tasksLoading || inboxLoading || eventsLoading
  const offline = Boolean(tasksError || inboxError || eventsError)
  const openTasks = tasks.filter((tsk) => tsk.status !== 'completed' && tsk.status !== 'archived').length
  const unread = comms.filter((c) => c.status === 'unread').length
  const now = new Date().toISOString()
  const upcoming = events.filter((e) => e.startAt >= now).length

  const refresh = useCallback(() => {
    reloadTasks()
    reloadInbox()
    reloadEvents()
  }, [reloadTasks, reloadInbox, reloadEvents])

  useFocusEffect(refresh)

  return (
    <Screen title={t('common.appName')} subtitle={t('home.subtitle')} showMark>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        {offline ? (
          <View style={styles.offlineBanner} accessible accessibilityLabel={t('common.reachability')}>
            <Text style={styles.offlineText}>{t('common.reachability')}</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          <StatCard label={t('home.openTasks')} value={offline ? '—' : openTasks} colors={colors} />
          <StatCard label={t('home.unread')} value={offline ? '—' : unread} colors={colors} />
          <StatCard label={t('home.upcomingEvents')} value={offline ? '—' : upcoming} colors={colors} />
        </View>

        <Text style={styles.sectionTitle}>{t('home.upcomingTasks')}</Text>
        {offline
          ? null
          : tasks
              .filter((tsk) => tsk.status !== 'completed' && tsk.status !== 'archived')
              .slice(0, 5)
              .map((tsk) => (
                <View
                  key={tsk.id}
                  style={styles.row}
                  accessible
                  accessibilityLabel={`${tsk.title}${tsk.priority === 'urgent' || tsk.priority === 'high' ? t('home.highPriority') : ''}`}
                >
                  <View
                    style={[styles.dot, tsk.priority === 'urgent' || tsk.priority === 'high' ? styles.dotHigh : null]}
                    importantForAccessibility="no"
                  />
                  <Text style={styles.rowText} numberOfLines={1}>
                    {tsk.title}
                  </Text>
                </View>
              ))}
        {!offline && !tasksLoading && openTasks === 0 && <Text style={styles.empty}>{t('home.noOpenTasks')}</Text>}
      </ScrollView>
    </Screen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    grid: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(6) },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing(4),
    },
    offlineBanner: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.warning,
      borderRadius: radius.md,
      padding: spacing(3),
      marginBottom: spacing(4),
    },
    offlineText: { color: colors.warning, fontSize: 13 },
    cardValue: { color: colors.primary, fontSize: 24, fontWeight: '700' },
    cardLabel: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: spacing(3) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(3),
      marginBottom: spacing(2),
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textSecondary, marginRight: spacing(3) },
    dotHigh: { backgroundColor: colors.danger },
    rowText: { color: colors.textPrimary, fontSize: 14, flex: 1 },
    empty: { color: colors.textSecondary, fontSize: 14 },
  })
}
