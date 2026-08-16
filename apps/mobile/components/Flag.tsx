import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg'
import type { Locale } from '../i18n'

const W = 24
const H = 16
const R = 2

function Base({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <ClipPath id={id}>
          <Rect width={W} height={H} rx={R} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>{children}</G>
    </Svg>
  )
}

const FLAGS: Record<Locale, React.ReactNode> = {
  it: (
    <Base id="flag-it">
      <Rect x={0} y={0} width={8} height={16} fill="#008C45" />
      <Rect x={8} y={0} width={8} height={16} fill="#F4F5F0" />
      <Rect x={16} y={0} width={8} height={16} fill="#CD212A" />
    </Base>
  ),
  en: (
    <Base id="flag-en">
      <Rect width={W} height={H} fill="#012169" />
      <Line x1={0} y1={0} x2={24} y2={16} stroke="#FFFFFF" strokeWidth={3.4} />
      <Line x1={24} y1={0} x2={0} y2={16} stroke="#FFFFFF" strokeWidth={3.4} />
      <Line x1={0} y1={0} x2={24} y2={16} stroke="#C8102E" strokeWidth={1.1} />
      <Line x1={24} y1={0} x2={0} y2={16} stroke="#C8102E" strokeWidth={1.1} />
      <Rect x={0} y={5.6} width={24} height={4.8} fill="#FFFFFF" />
      <Rect x={9.2} y={0} width={5.6} height={16} fill="#FFFFFF" />
      <Rect x={0} y={6.9} width={24} height={2.2} fill="#C8102E" />
      <Rect x={10.6} y={0} width={2.8} height={16} fill="#C8102E" />
    </Base>
  ),
  de: (
    <Base id="flag-de">
      <Rect x={0} y={0} width={24} height={5.33} fill="#000000" />
      <Rect x={0} y={5.33} width={24} height={5.33} fill="#DD0000" />
      <Rect x={0} y={10.66} width={24} height={5.34} fill="#FFCE00" />
    </Base>
  ),
  es: (
    <Base id="flag-es">
      <Rect x={0} y={0} width={24} height={4} fill="#AA151B" />
      <Rect x={0} y={4} width={24} height={8} fill="#F1BF00" />
      <Rect x={0} y={12} width={24} height={4} fill="#AA151B" />
    </Base>
  ),
  fr: (
    <Base id="flag-fr">
      <Rect x={0} y={0} width={8} height={16} fill="#0055A4" />
      <Rect x={8} y={0} width={8} height={16} fill="#FFFFFF" />
      <Rect x={16} y={0} width={8} height={16} fill="#EF4135" />
    </Base>
  ),
  ru: (
    <Base id="flag-ru">
      <Rect x={0} y={0} width={24} height={5.33} fill="#FFFFFF" />
      <Rect x={0} y={5.33} width={24} height={5.33} fill="#0039A6" />
      <Rect x={0} y={10.66} width={24} height={5.34} fill="#D52B1E" />
    </Base>
  ),
  zh: (
    <Base id="flag-zh">
      <Rect width={W} height={H} fill="#DE2910" />
      <Path
        d="M5 2.6 5.7 4.7 7.9 4.7 6.1 6 6.8 8.1 5 6.8 3.2 8.1 3.9 6 2.1 4.7 4.3 4.7Z"
        fill="#FFDE00"
      />
      <Circle cx={9.5} cy={2} r={0.5} fill="#FFDE00" />
      <Circle cx={11} cy={3.6} r={0.5} fill="#FFDE00" />
      <Circle cx={11} cy={5.8} r={0.5} fill="#FFDE00" />
      <Circle cx={9.5} cy={7.2} r={0.5} fill="#FFDE00" />
    </Base>
  ),
  ja: (
    <Base id="flag-ja">
      <Rect width={W} height={H} fill="#FFFFFF" />
      <Circle cx={12} cy={8} r={4.6} fill="#BC002D" />
    </Base>
  ),
}

export function Flag({ locale }: { locale: Locale }) {
  return <>{FLAGS[locale]}</>
}
