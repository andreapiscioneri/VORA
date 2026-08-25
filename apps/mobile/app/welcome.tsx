import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Svg, { Path } from 'react-native-svg'
import { BrandMark } from '../components/BrandMark'
import { Wordmark } from '../components/Wordmark'
import { ModulesSection } from '../components/welcome/ModulesSection'
import { CustomersSection } from '../components/welcome/CustomersSection'
import { AutomationSection } from '../components/welcome/AutomationSection'
import { PricingSection } from '../components/welcome/PricingSection'
import { DemoSection } from '../components/welcome/DemoSection'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import { radius, spacing } from '../constants/theme'

// Same angular mark as BrandMark's icon, rendered large as decorative hero
// background art (mirrors apps/web's MarketingLandingHero).
const GLYPH_PATH =
  'M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z'

const MONO = { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }

export default function WelcomeScreen() {
  const router = useRouter()
  const { t } = useI18n()
  const { width, height } = useWindowDimensions()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion)
    return () => sub.remove()
  }, [])

  const progress = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1.12)).current
  const glow = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1)
      scale.setValue(1)
      glow.setValue(0.65)
      return
    }
    Animated.timing(progress, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    Animated.timing(scale, { toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.85, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start()
  }, [reducedMotion])

  function rise(start: number, end: number) {
    return {
      opacity: progress.interpolate({ inputRange: [start, end], outputRange: [0, 1], extrapolate: 'clamp' as const }),
      transform: [{ translateY: progress.interpolate({ inputRange: [start, end], outputRange: [18, 0], extrapolate: 'clamp' as const }) }],
    }
  }

  function goToLogin() {
    haptics.press()
    router.push('/login')
  }

  const glyphSize = Math.max(width, height) * 0.9
  const contentWidth = Math.min(440, width * 0.86)

  return (
    <View style={styles.pageRoot}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height }]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backgroundLayer, { transform: [{ scale }] }]}
          >
            <View style={styles.gradientBase} />
            <Animated.View style={[styles.glyphWrap, { opacity: glow, right: -glyphSize * 0.35, bottom: -glyphSize * 0.3 }]}>
              <Svg width={glyphSize} height={glyphSize} viewBox="0 0 256 256">
                <Path d={GLYPH_PATH} fill="#39FF14" fillOpacity={0.9} />
              </Svg>
            </Animated.View>
          </Animated.View>

          <View pointerEvents="none" style={styles.scrim} />

          <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <BrandMark size={26} />
                <Wordmark size={20} color="#FFFFFF" />
              </View>
              <Pressable onPress={goToLogin} accessibilityRole="button" hitSlop={8} style={styles.signInPill}>
                <Text style={styles.signInText}>{t('auth.submitLogin')}</Text>
              </Pressable>
            </View>

            <View style={[styles.content, { maxWidth: contentWidth }]}>
              <Animated.Text style={[styles.eyebrow, rise(0, 0.3)]}>
                {t('welcome.eyebrowPrefix')}
                <Text style={styles.eyebrowEmphasis}>{t('welcome.eyebrowEmphasis')}</Text>
              </Animated.Text>

              <Animated.Text style={[styles.headline, rise(0.15, 0.5)]}>
                {t('welcome.headline1')}
                {'\n'}
                {t('welcome.headline2')}
                {'\n'}
                {t('welcome.headline3')}
              </Animated.Text>

              <Animated.Text style={[styles.paragraph, rise(0.3, 0.65)]}>{t('welcome.paragraph')}</Animated.Text>

              <Animated.View style={rise(0.45, 0.8)}>
                <Pressable onPress={goToLogin} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <Text style={styles.ctaText}>{t('welcome.cta')}</Text>
                </Pressable>
              </Animated.View>
            </View>
          </SafeAreaView>
        </View>

        <ModulesSection />
        <CustomersSection />
        <AutomationSection />
        <PricingSection onCta={goToLogin} />
        <DemoSection onCta={goToLogin} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  pageRoot: { flex: 1, backgroundColor: '#050505' },
  scrollContent: { flexGrow: 1 },
  hero: { position: 'relative', overflow: 'hidden', backgroundColor: '#050505' },
  backgroundLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gradientBase: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A0A0A' },
  glyphWrap: { position: 'absolute' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,5,0.35)' },
  safe: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingTop: spacing(2),
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  signInPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: radius.full,
  },
  signInText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { paddingHorizontal: spacing(5), paddingBottom: spacing(6) },
  eyebrow: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing(3), ...MONO },
  eyebrowEmphasis: { fontStyle: 'italic' },
  headline: { color: '#FFFFFF', fontSize: 40, lineHeight: 42, fontWeight: '700', letterSpacing: -1.5, marginBottom: spacing(4), ...MONO },
  paragraph: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22, marginBottom: spacing(6), ...MONO },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: '#39FF14',
    paddingHorizontal: spacing(7),
    paddingVertical: spacing(4),
    borderRadius: radius.full,
  },
  ctaPressed: { transform: [{ scale: 0.96 }] },
  ctaText: { color: '#0A0A0A', fontSize: 15, fontWeight: '700', ...MONO },
})
