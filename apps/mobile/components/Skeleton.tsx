import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'

// A single pulsing placeholder block, used in place of a list row while its
// real content is still loading — replaces the "blank screen until the
// fetch resolves" gap that pull-to-refresh alone doesn't cover on first load.
export function SkeletonRow({ height = 64, style }: { height?: number; style?: object }) {
  const { colors } = useTheme()
  const pulse = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return <Animated.View style={[styles.row, { height, backgroundColor: colors.surface, opacity: pulse }, style]} />
}

// Drop-in replacement for a list's content while `loading && items.length
// === 0` — matches the row height/spacing/margins list screens already use
// so it doesn't jump when real rows appear.
export function SkeletonList({ count = 4, rowHeight = 64 }: { count?: number; rowHeight?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} height={rowHeight} style={styles.listRow} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing(5), paddingTop: spacing(1) },
  row: { borderRadius: radius.md },
  listRow: { marginBottom: spacing(2) },
})
