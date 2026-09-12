import { useCallback } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useTasks } from '../../hooks/useTasks'
import { useInbox } from '../../hooks/useInbox'
import { useEvents } from '../../hooks/useEvents'
import { Screen } from '../../components/Screen'
import { GlassCard } from '../../components/GlassCard'
import { GradientBadge } from '../../components/GradientBadge'
import { MODULE_NAV_ITEMS } from '../../constants/moduleNav'
import { MODULE_ICONS } from '../../constants/moduleIcons'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { IconName } from '../../components/Icon'

function StatCard({ label, value, icon, colors }: { label: string; value: number | string; icon: IconName; colors: ThemeColors }) {
  const styles = makeStyles(colors)
  return (
    <GlassCard style={styles.card}>
      <View accessible accessibilityLabel={`${label}: ${value}`}>
        <GradientBadge icon={icon} size={34} />
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    </GlassCard>
  )
}

export default function HomeScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
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
          <StatCard label={t('home.openTasks')} value={offline ? '—' : openTasks} icon="check-square" colors={colors} />
          <StatCard label={t('home.unread')} value={offline ? '—' : unread} icon="inbox" colors={colors} />
          <StatCard label={t('home.upcomingEvents')} value={offline ? '—' : upcoming} icon="calendar" colors={colors} />
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

        <Text style={[styles.sectionTitle, { marginTop: spacing(6) }]}>{t('home.modules.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('home.modules.subtitle')}</Text>
        <View style={styles.moduleGrid}>
          {MODULE_NAV_ITEMS.map(({ key, route }) => (
            <Pressable
              key={key}
              onPress={() => {
                haptics.tap()
                router.push(route)
              }}
              style={({ pressed }) => [styles.moduleTile, pressed && styles.moduleTilePressed]}
              accessibilityRole="button"
              accessibilityLabel={t(`more.items.${key}.label`)}
            >
              <GlassCard style={styles.moduleTileCard}>
                <GradientBadge icon={MODULE_ICONS[key] ?? 'chevron-right'} size={40} />
                <Text style={styles.moduleTileLabel} numberOfLines={2}>
                  {t(`more.items.${key}.label`)}
                </Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    grid: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(6) },
    card: { flex: 1 },
    offlineBanner: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.warning,
      borderRadius: radius.md,
      padding: spacing(3),
      marginBottom: spacing(4),
    },
    offlineText: { color: colors.warning, fontSize: 13 },
    cardValue: { color: colors.primary, fontSize: 24, fontWeight: '700', marginTop: spacing(3) },
    cardLabel: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: spacing(1) },
    sectionSubtitle: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing(4) },
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3) },
    moduleTile: { width: '30%' },
    moduleTilePressed: { opacity: 0.7 },
    moduleTileCard: { alignItems: 'center', paddingVertical: spacing(4), paddingHorizontal: spacing(2), gap: spacing(2) },
    moduleTileLabel: { color: colors.textPrimary, fontSize: 11.5, fontWeight: '600', textAlign: 'center' },
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
