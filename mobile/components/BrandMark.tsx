import Svg, { G, Path, Rect } from 'react-native-svg'

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width={100} height={100} rx={22} fill="#0a0a0a" />
      <G fill="none" stroke="#39FF14" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 26 L48 74" strokeWidth={8.5} opacity={0.55} />
        <Path d="M78 26 L52 74" strokeWidth={8.5} opacity={0.55} />
        <Path d="M50 20 L50 74" strokeWidth={8.5} />
      </G>
    </Svg>
  )
}
