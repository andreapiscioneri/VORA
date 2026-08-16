import { Text, TextProps } from 'react-native'
import { useFonts, Roboto_700Bold } from '@expo-google-fonts/roboto'

export function useWordmarkFontsLoaded() {
  const [loaded] = useFonts({ Roboto_700Bold })
  return loaded
}

export function Wordmark({ size = 24, color, style, ...rest }: { size?: number; color: string } & TextProps) {
  const loaded = useWordmarkFontsLoaded()
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: size,
          color,
          letterSpacing: -0.5,
          fontFamily: loaded ? 'Roboto_700Bold' : undefined,
          fontWeight: loaded ? undefined : '700',
        },
        style,
      ]}
    >
      Vora
    </Text>
  )
}
