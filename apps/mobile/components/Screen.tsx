import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { BrandMark } from './BrandMark'
import { Wordmark } from './Wordmark'
import { Icon } from './Icon'
import { AppMenu } from './AppMenu'
import { NotificationInbox } from './NotificationInbox'
import { AmbientBackground } from './AmbientBackground'
import { api } from '../lib/api'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { haptics } from '../lib/haptics'

export function Screen({
  title,
  subtitle,
  showMark,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string; showMark?: boolean }>) {
  const { colors } = useTheme()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!showMark) return
    api
      .get<{ count: number }>('/notifications/unread-count')
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {})
  }, [showMark, inboxOpen])

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <AmbientBackground />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {showMark ? (
            <>
              <View style={styles.sideLeft}>
                <Pressable
                  onPress={() => {
                    haptics.press()
                    setMenuOpen(true)
                  }}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={({ pressed }) => [styles.menuButton, { backgroundColor: colors.surface }, pressed && styles.menuButtonPressed]}
                >
                  <Icon name="menu" size={20} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.brandCenter}>
                <BrandMark size={28} />
                <Wordmark size={24} color={colors.textPrimary} />
              </View>

              <View style={[styles.sideRight, styles.sideRightRow]}>
                <Pressable
                  onPress={() => {
                    haptics.press()
                    router.push('/assistant')
                  }}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={({ pressed }) => [styles.menuButton, { backgroundColor: colors.surface }, pressed && styles.menuButtonPressed]}
                  accessibilityLabel="Assistente"
                >
                  <Icon name="sparkles" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    haptics.press()
                    setInboxOpen(true)
                  }}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={({ pressed }) => [styles.menuButton, { backgroundColor: colors.surface }, pressed && styles.menuButtonPressed]}
                  accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                >
                  <Icon name="bell" size={18} color={colors.textPrimary} />
                  {unreadCount > 0 ? (
                    <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          )}
        </View>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {children}
      {showMark ? <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} /> : null}
      {showMark ? <NotificationInbox visible={inboxOpen} onClose={() => setInboxOpen(false)} /> : null}
    </SafeAreaView>
  )
}

export function DetailScreen({
  title,
  subtitle,
  headerRight,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string; headerRight?: ReactNode }>) {
  const { colors } = useTheme()
  const router = useRouter()
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <AmbientBackground />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => {
              haptics.tap()
              router.back()
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
          >
            <Icon name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          {headerRight}
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </SafeAreaView>
  )
}

export function StateMessage({ text }: { text: string }) {
  const { colors } = useTheme()
  const fade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fade.setValue(0)
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start()
  }, [text])

  return (
    <Animated.View style={[styles.state, { opacity: fade }]}>
      <Text style={[styles.stateText, { color: colors.textSecondary }]}>{text}</Text>
    </Animated.View>
  )
}

// Shown above a list that's rendering cached (AsyncStorage) data because the
// live fetch failed — the data is real, just not necessarily current.
export function OfflineBanner({ text }: { text: string }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.offlineBanner, { backgroundColor: colors.border }]}>
      <Text style={[styles.offlineBannerText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing(5), paddingTop: spacing(4), paddingBottom: spacing(5) },
  backButton: { marginBottom: spacing(3), alignSelf: 'flex-start' },
  backButtonPressed: { opacity: 0.5 },
  menuButtonPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  sideLeft: { flex: 1, alignItems: 'flex-start' },
  sideRight: { flex: 1, alignItems: 'flex-end' },
  sideRightRow: { flexDirection: 'row', gap: spacing(2) },
  brandCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  menuButton: { width: 34, height: 34, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: spacing(2), lineHeight: 19 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(8) },
  stateText: { fontSize: 15, textAlign: 'center' },
  offlineBanner: { marginHorizontal: spacing(5), marginBottom: spacing(3), borderRadius: spacing(2), paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
  offlineBannerText: { fontSize: 12, textAlign: 'center' },
})
