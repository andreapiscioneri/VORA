import { StyleSheet, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useTheme } from '../contexts/ThemeContext'

// The mobile equivalent of the web app shell's ambient backdrop
// (layouts/default.vue) — two soft green radial blobs behind every
// authenticated screen so GlassCard surfaces have something to actually
// look "glass" against. Without this, a translucent card over a flat
// background is indistinguishable from a plain opaque one (the same bug
// fixed on the web landing page, where backdrop-blur had nothing to blur).
export function AmbientBackground() {
  const { scheme } = useTheme()
  const isDark = scheme === 'dark'
  const opacityA = isDark ? 0.12 : 0.07
  const opacityB = isDark ? 0.1 : 0.05

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="ambientA" cx="15%" cy="8%" r="60%">
            <Stop offset="0%" stopColor="#39FF14" stopOpacity={opacityA} />
            <Stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="ambientB" cx="88%" cy="92%" r="55%">
            <Stop offset="0%" stopColor="#39FF14" stopOpacity={opacityB} />
            <Stop offset="100%" stopColor="#39FF14" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientA)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientB)" />
      </Svg>
    </View>
  )
}
