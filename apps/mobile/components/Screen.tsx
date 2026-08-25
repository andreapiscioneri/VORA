import { PropsWithChildren, ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { BrandMark } from './BrandMark'
import { Wordmark } from './Wordmark'
import { Icon } from './Icon'
import { spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'

export function Screen({
  title,
  subtitle,
  showMark,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string; showMark?: boolean }>) {
  const { colors } = useTheme()
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {showMark ? <BrandMark size={30} /> : null}
          {showMark ? <Wordmark size={28} color={colors.textPrimary} /> : <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
        </View>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {children}
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
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
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
  return (
    <View style={styles.state}>
      <Text style={[styles.stateText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
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
  header: { paddingHorizontal: spacing(5), paddingTop: spacing(3), paddingBottom: spacing(4) },
  backButton: { marginBottom: spacing(3), alignSelf: 'flex-start' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: spacing(1) },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(8) },
  stateText: { fontSize: 15, textAlign: 'center' },
  offlineBanner: { marginHorizontal: spacing(5), marginBottom: spacing(3), borderRadius: spacing(2), paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
  offlineBannerText: { fontSize: 12, textAlign: 'center' },
})
