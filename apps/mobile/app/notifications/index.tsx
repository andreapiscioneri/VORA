import { useRouter } from 'expo-router'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { useNotifications } from '../../hooks/useNotifications'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { AppNotification } from '@vora/shared/types/notification'

export default function NotificationsInboxScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { notifications, loading, loadingMore, error, hasMore, reload, loadMore, markRead, remove } = useNotifications()

  return (
    <DetailScreen
      title={t('modules.notifications.inbox.title')}
      subtitle={t('modules.notifications.count', { count: notifications.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/notifications/preferences')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.notifications.inbox.preferences')}
          hitSlop={12}
        >
          <Icon name="settings" size={20} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={error} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.notifications.inbox.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          renderItem={({ item }: { item: AppNotification }) => (
            <Pressable
              onPress={() => {
                haptics.tap()
                markRead(item.id, !item.read)
              }}
              style={[styles.row, !item.read && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.body}, ${item.read ? t('modules.notifications.inbox.markUnread') : t('modules.notifications.inbox.markRead')}`}
            >
              <View style={styles.rowMain}>
                <Text style={[styles.rowTitle, { fontWeight: item.read ? '500' : '700' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.rowDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation()
                  haptics.warning()
                  remove(item.id)
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('modules.notifications.inbox.delete')}
              >
                <Icon name="trash" size={18} color={colors.textSecondary} />
              </Pressable>
            </Pressable>
          )}
          ListFooterComponent={loadingMore ? <StateMessage text={t('common.loadingMore')} /> : null}
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
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
      gap: spacing(3),
    },
    rowMain: { flex: 1 },
    rowTitle: { color: colors.textPrimary, fontSize: 15 },
    rowBody: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(1) },
    rowDate: { color: colors.textSecondary, fontSize: 11, marginTop: spacing(1) },
  })
}
