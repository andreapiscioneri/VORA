import type { ColorValue } from 'react-native'
import Svg, { Path } from 'react-native-svg'

// Same Lucide-style, stroke-based, 24x24 icon set as the VORA web app
// (components/ui/Icon.vue), reused here for visual consistency.
const ICONS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9',
  'check-square': 'm9 11 3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 0 8 7 8-7',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  'more-horizontal': 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m14.14 6.14 1.42 1.42M4.44 4.44l1.42 1.42m0 12.28-1.42 1.42M19.56 4.44l-1.42 1.42M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z',
  monitor: 'M2 4h20v12H2Zm5 16h10M12 16v4',
  'arrow-left': 'M19 12H5m0 0 7 7m-7-7 7-7',
  'chevron-right': 'm9 18 6-6-6-6',
  'log-out': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z',
}

export function Icon({
  name,
  size = 22,
  color = '#8A8A8A',
}: {
  name: keyof typeof ICONS
  size?: number
  color?: ColorValue
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color as string} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={ICONS[name]} />
    </Svg>
  )
}
