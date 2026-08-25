import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useTasks } from '../../hooks/useTasks'
import { Screen, StateMessage, OfflineBanner } from '../../components/Screen'
import { radius, spacing } from '../../constants/theme'
import { nextStatus } from '../../lib/taskStatus'
import { haptics } from '../../lib/haptics'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import type { ThemeColors } from '../../constants/theme'
import type { Task } from '@vora/shared/types/task'

export default function TasksScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { tasks, loading, loadingMore, error, offline, hasMore, reload, loadMore, setStatus } = useTasks()
  const active = tasks.filter((tsk) => tsk.status !== 'archived')
  const statusLabel = (status: Task['status']) => t(`tasks.status.${status}`)

  return (
    <Screen title={t('tasks.title')} subtitle={t('tasks.count', { count: active.length })}>
      {error ? (
        <StateMessage text={t('tasks.error', { error })} />
      ) : (
        <>
          {offline ? <OfflineBanner text={t('common.offlineCached')} /> : null}
          <FlatList
          data={active}
          keyExtractor={(tsk) => tsk.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('tasks.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: Task }) => {
            const isDone = item.status === 'completed'
            const advanceTo = nextStatus(item.status)
            return (
              <Pressable
                style={styles.row}
                disabled={isDone}
                onPress={() => {
                  if (advanceTo === 'completed') haptics.success()
                  else haptics.tap()
                  setStatus(item.id, advanceTo)
                }}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${statusLabel(item.status)}`}
                accessibilityHint={isDone ? undefined : t('tasks.advanceHint', { status: statusLabel(nextStatus(item.status)) })}
                accessibilityState={{ disabled: isDone }}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.deadline ? <Text style={styles.deadline}>{item.deadline}</Text> : null}
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statusLabel(item.status)}</Text>
                </View>
              </Pressable>
            )
          }}
          />
        </>
      )}
    </Screen>
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
    deadline: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    badge: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(3) },
    badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
    footer: { paddingVertical: spacing(4) },
  })
}
