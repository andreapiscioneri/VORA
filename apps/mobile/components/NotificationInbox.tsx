import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Icon } from './Icon'
import { StateMessage } from './Screen'
import { useNotifications } from '../hooks/useNotifications'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import type { AppNotification } from '@vora/shared/types/notification'

// Full-screen overlay, same open/close animation as AppMenu — a device with
// no push entitlement (see appNotifications.ts) still gets these in-app.
export function NotificationInbox({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const anim = useRef(new Animated.Value(0)).current
  const { notifications, loading, loadingMore, error, hasMore, reload, loadMore, markRead, remove } = useNotifications()

  useEffect(() => {
    if (visible) {
      setMounted(true)
      reload()
      Animated.timing(anim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false)
      })
    }
  }, [visible])

  if (!mounted) return null

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.overlay,
        { backgroundColor: colors.background, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] },
      ]}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              haptics.press()
              onClose()
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <Icon name="x" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('modules.notifications.inbox.title')}</Text>
          <Pressable
            onPress={() => {
              haptics.tap()
              onClose()
              router.push('/notifications')
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
            accessibilityLabel={t('modules.notifications.inbox.viewAll')}
          >
            <Icon name="chevron-right" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            haptics.tap()
            onClose()
            router.push('/notifications')
          }}
          style={styles.viewAllLink}
          accessibilityRole="link"
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>{t('modules.notifications.inbox.viewAll')}</Text>
        </Pressable>

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
                style={[styles.row, { backgroundColor: colors.surface }, !item.read && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.body}`}
              >
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary, fontWeight: item.read ? '500' : '700' }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.rowBody, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.body}
                  </Text>
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
                  <Icon name="trash" size={16} color={colors.textSecondary} />
                </Pressable>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(5), paddingTop: spacing(2), paddingBottom: spacing(4) },
  iconButton: { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  viewAllLink: { paddingHorizontal: spacing(5), paddingBottom: spacing(3) },
  viewAllText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10), gap: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, padding: spacing(4), gap: spacing(3) },
  rowMain: { flex: 1 },
  rowTitle: { fontSize: 14 },
  rowBody: { fontSize: 12, marginTop: spacing(1) },
})
