import { StyleSheet, View, type ViewStyle } from 'react-native'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'

// React Native has no CSS backdrop-filter, and adding expo-blur (a native
// module) would mean re-linking the existing manually-built Xcode project —
// too much risk for a visual pass. This approximates the same "glass" read
// with a translucent surface + soft border + shadow instead of a literal
// blur, matching the web app's glass-card language (WidgetFrame.vue) without
// a new native dependency.
export function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const { scheme } = useTheme()
  const isDark = scheme === 'dark'

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.7)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)',
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
})
