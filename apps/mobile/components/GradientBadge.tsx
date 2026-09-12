import { StyleSheet, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { Icon, type IconName } from './Icon'
import { radius } from '../constants/theme'

// A green-gradient icon badge — the mobile equivalent of the web app's
// `linear-gradient(135deg, rgba(57,255,20,0.2), rgba(57,255,20,0.05))` icon
// tiles (WidgetFrame.vue, the dashboard module grid). RN has no gradient
// fill for plain Views, but react-native-svg (already a dependency, no new
// native linking) can paint one directly.
export function GradientBadge({ icon, size = 40, iconSize, iconColor = '#39FF14' }: { icon: IconName; size?: number; iconSize?: number; iconColor?: string }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="badgeGrad" cx="30%" cy="25%" r="80%">
            <Stop offset="0%" stopColor="#39FF14" stopOpacity={0.28} />
            <Stop offset="100%" stopColor="#39FF14" stopOpacity={0.06} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} rx={size * 0.32} fill="url(#badgeGrad)" />
      </Svg>
      <Icon name={icon} size={iconSize ?? size * 0.48} color={iconColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
})
