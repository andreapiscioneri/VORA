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
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  'credit-card': 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm0 4h20',
  'book-open': 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Zm20 0h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z',
  flag: 'M4 22V4a1 1 0 0 1 1-1h13.5a1 1 0 0 1 .8 1.6l-3 4a1 1 0 0 0 0 1.2l3 4a1 1 0 0 1-.8 1.6H5',
  megaphone: 'M3 11v3a1 1 0 0 0 1 1h2l3 6h2l-1-6h4l7 5V5l-7 5H6l-3 1Z',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 1-.14 1.44l1.9 1.48a.5.5 0 0 1 .12.63l-1.8 3.12a.5.5 0 0 1-.6.22l-2.24-.9a7.5 7.5 0 0 1-1.25.72l-.34 2.38a.5.5 0 0 1-.5.41h-3.6a.5.5 0 0 1-.5-.41l-.34-2.38a7.5 7.5 0 0 1-1.25-.72l-2.24.9a.5.5 0 0 1-.6-.22l-1.8-3.12a.5.5 0 0 1 .12-.63l1.9-1.48A7.4 7.4 0 0 1 4.6 12c0-.49.05-.97.14-1.44l-1.9-1.48a.5.5 0 0 1-.12-.63l1.8-3.12a.5.5 0 0 1 .6-.22l2.24.9c.39-.3.8-.54 1.25-.72l.34-2.38a.5.5 0 0 1 .5-.41h3.6a.5.5 0 0 1 .5.41l.34 2.38c.45.18.86.42 1.25.72l2.24-.9a.5.5 0 0 1 .6.22l1.8 3.12a.5.5 0 0 1-.12.63l-1.9 1.48c.09.47.14.95.14 1.44Z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-10-10h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10Z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z',
  'trending-up': 'm23 6-9.5 9.5-5-5L1 18M17 6h6v6',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z',
  'life-buoy': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7.07-8.07-3.54 3.54M8.47 12.47 4.93 16.02M4.93 7.93l3.54 3.54M15.53 12.47l3.54 3.55',
  umbrella: 'M12 2a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9ZM12 11v9a2 2 0 0 1-4 0M12 2v2',
  sparkles: 'M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1',
}

export type IconName = keyof typeof ICONS

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
