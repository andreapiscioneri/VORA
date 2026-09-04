import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTasks } from '../../hooks/useTasks'
import { Screen, StateMessage, OfflineBanner } from '../../components/Screen'
import { Icon } from '../../components/Icon'
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
  const router = useRouter()
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
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation()
                    haptics.tap()
                    router.push(`/tasks/${item.id}`)
                  }}
                  hitSlop={8}
                  style={styles.editButton}
                  accessibilityRole="button"
                  accessibilityLabel={t('tasks.form.editTitle')}
                >
                  <Icon name="chevron-right" size={18} color={colors.textSecondary} />
                </Pressable>
              </Pressable>
            )
          }}
          />
        </>
      )}

      <Pressable
        onPress={() => {
          haptics.tap()
          router.push('/tasks/new')
        }}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={t('tasks.form.newTitle')}
      >
        <Icon name="plus" size={24} color="#0A0A0A" />
      </Pressable>
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
    editButton: { marginLeft: spacing(2), padding: spacing(1) },
    footer: { paddingVertical: spacing(4) },
    fab: {
      position: 'absolute',
      right: spacing(5),
      bottom: spacing(6),
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
  })
}
