import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg'
import { BrandMark } from '../components/BrandMark'
import { Wordmark } from '../components/Wordmark'
import { Icon } from '../components/Icon'
import { Flag } from '../components/Flag'
import { ModulesSection } from '../components/welcome/ModulesSection'
import { CustomersSection } from '../components/welcome/CustomersSection'
import { AutomationSection } from '../components/welcome/AutomationSection'
import { PricingSection } from '../components/welcome/PricingSection'
import { DemoSection } from '../components/welcome/DemoSection'
import { ContactSection } from '../components/welcome/ContactSection'
import { useI18n, LOCALE_CODES, LOCALE_NAMES, type Locale } from '../i18n'
import { useTheme } from '../contexts/ThemeContext'
import { haptics } from '../lib/haptics'
import { radius, spacing } from '../constants/theme'
import type { ThemeColors } from '../constants/theme'

const SECTIONS = ['modules', 'customers', 'automation', 'pricing', 'demo', 'contact'] as const
type SectionKey = (typeof SECTIONS)[number]

// Same angular mark as BrandMark's icon, rendered large as decorative hero
// background art (mirrors apps/web's MarketingLandingHero).
const GLYPH_PATH =
  'M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z'

export default function WelcomeScreen() {
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()
  const { colors, scheme } = useTheme()
  const styles = makeStyles(colors)
  const { width, height } = useWindowDimensions()
  const [reducedMotion, setReducedMotion] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuMounted, setMenuMounted] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const menuAnim = useRef(new Animated.Value(0)).current
  const scrollRef = useRef<ScrollView>(null)
  const sectionY = useRef<Partial<Record<SectionKey, number>>>({})

  function recordSectionY(key: SectionKey) {
    return (e: LayoutChangeEvent) => {
      sectionY.current[key] = e.nativeEvent.layout.y
    }
  }

  function scrollToSection(key: SectionKey) {
    haptics.press()
    closeMenu()
    const y = sectionY.current[key]
    if (y !== undefined) scrollRef.current?.scrollTo({ y, animated: true })
  }

  function closeMenu() {
    setMenuOpen(false)
    setLangOpen(false)
  }

  function selectLocale(next: Locale) {
    haptics.press()
    setLocale(next)
    closeMenu()
  }

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (menuOpen) {
      setMenuMounted(true)
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: reducedMotion ? 0 : 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start()
    } else if (menuMounted) {
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: reducedMotion ? 0 : 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMenuMounted(false)
      })
    }
  }, [menuOpen])

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
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: height * 0.74 }]}>
          <Animated.View
            style={[styles.backgroundLayer, { transform: [{ scale }], pointerEvents: 'none' }]}
          >
            <View style={styles.gradientBase} />
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
              <Defs>
                <RadialGradient id="glowA" cx="30%" cy="20%" r="65%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.16} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="glowB" cx="80%" cy="90%" r="60%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.1} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowA)" />
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowB)" />
            </Svg>
            <Animated.View style={[styles.glyphWrap, { opacity: glow, right: -glyphSize * 0.35, bottom: -glyphSize * 0.3 }]}>
              <Svg width={glyphSize} height={glyphSize} viewBox="0 0 256 256">
                <Path d={GLYPH_PATH} fill={colors.primary} fillOpacity={0.9} />
              </Svg>
            </Animated.View>
          </Animated.View>

          <View style={[styles.scrim, { pointerEvents: 'none' }]} />

          <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <Pressable
                  onPress={() => {
                    haptics.press()
                    setMenuOpen(true)
                  }}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.menuButton}
                >
                  <Icon name="menu" size={20} color={colors.textPrimary} />
                </Pressable>
                <BrandMark size={26} />
                <Wordmark size={20} color={colors.textPrimary} />
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

              <Animated.View style={[styles.statsRow, rise(0.6, 0.9)]}>
                {(['modules', 'ai', 'data'] as const).map((key) => (
                  <View key={key} style={styles.statItem}>
                    <Text style={styles.statValue}>{t(`welcome.stats.${key}.value`)}</Text>
                    <Text style={styles.statLabel}>{t(`welcome.stats.${key}.label`)}</Text>
                  </View>
                ))}
              </Animated.View>
            </View>
          </SafeAreaView>
        </View>

        <View onLayout={recordSectionY('modules')}>
          <ModulesSection />
        </View>
        <View onLayout={recordSectionY('customers')}>
          <CustomersSection />
        </View>
        <View onLayout={recordSectionY('automation')}>
          <AutomationSection />
        </View>
        <View onLayout={recordSectionY('pricing')}>
          <PricingSection onCta={goToLogin} />
        </View>
        <View onLayout={recordSectionY('demo')}>
          <DemoSection onCta={goToLogin} />
        </View>
        <View onLayout={recordSectionY('contact')}>
          <ContactSection />
        </View>
      </ScrollView>

      {menuMounted && (
        <Animated.View
          pointerEvents={menuOpen ? 'auto' : 'none'}
          style={[
            styles.menuOverlay,
            {
              opacity: menuAnim,
              transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
            },
          ]}
        >
          <SafeAreaView style={styles.menuOverlaySafe} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.menuTopBar}>
              <View style={styles.brandRow}>
                <BrandMark size={26} />
                <Wordmark size={20} color={colors.textPrimary} />
              </View>
              <Pressable
                onPress={() => {
                  haptics.press()
                  closeMenu()
                }}
                accessibilityRole="button"
                hitSlop={8}
                style={styles.menuButton}
              >
                <Icon name="x" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.menuLinks}>
                {SECTIONS.map((key) => (
                  <Pressable key={key} onPress={() => scrollToSection(key)} style={styles.menuLink}>
                    <Text style={styles.menuLinkText}>{t(`welcome.${key}.eyebrow`)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.langSelector}>
                <Pressable
                  onPress={() => {
                    haptics.press()
                    setLangOpen((v) => !v)
                  }}
                  accessibilityRole="button"
                  style={styles.langSelectorButton}
                >
                  <View style={styles.langSelectorCurrent}>
                    <Flag locale={locale} />
                    <Text style={styles.langSelectorText}>{LOCALE_NAMES[locale]}</Text>
                  </View>
                  <View style={{ transform: [{ rotate: langOpen ? '180deg' : '0deg' }] }}>
                    <Icon name="chevron-down" size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>

                {langOpen && (
                  <View style={styles.langList}>
                    {LOCALE_CODES.map((code, index) => (
                      <Pressable
                        key={code}
                        onPress={() => selectLocale(code)}
                        style={[styles.langOption, index < LOCALE_CODES.length - 1 && styles.langOptionDivider]}
                      >
                        <View style={styles.langSelectorCurrent}>
                          <Flag locale={code} />
                          <Text style={styles.langOptionText}>{LOCALE_NAMES[code]}</Text>
                        </View>
                        {code === locale && <Icon name="check-square" size={16} color={colors.primary} />}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <Pressable onPress={goToLogin} accessibilityRole="button" style={({ pressed }) => [styles.menuCta, pressed && styles.ctaPressed]}>
                <Text style={styles.menuCtaText}>{t('auth.submitLogin')}</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  const glass = colors.textPrimary + '1A'
  return StyleSheet.create({
    pageRoot: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },
    hero: { position: 'relative', overflow: 'hidden', backgroundColor: colors.background },
    backgroundLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    gradientBase: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background },
    glyphWrap: { position: 'absolute' },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background + '59' },
    safe: { flex: 1, justifyContent: 'space-between' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(5),
      paddingTop: spacing(2),
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    menuButton: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: glass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInPill: {
      backgroundColor: glass,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(2),
      borderRadius: radius.full,
    },
    signInText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
    },
    menuOverlaySafe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    menuTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(5),
      paddingTop: spacing(2),
      paddingBottom: spacing(4),
    },
    menuScrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing(5),
      justifyContent: 'space-between',
    },
    menuLinks: { gap: spacing(1) },
    menuLink: { paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
    menuLinkText: { color: colors.textPrimary, fontSize: 20, fontWeight: '600' },
    langSelector: { marginTop: spacing(6) },
    langSelectorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(4),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    langSelectorCurrent: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    langSelectorText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    langList: {
      marginTop: spacing(2),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    langOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(4),
      backgroundColor: colors.surface,
    },
    langOptionDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    langOptionText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
    menuCta: {
      marginTop: spacing(6),
      marginBottom: spacing(6),
      alignItems: 'center',
      paddingVertical: spacing(4),
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    menuCtaText: { color: '#0A0A0A', fontSize: 15, fontWeight: '700' },
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(6) },
    eyebrow: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: spacing(3) },
    eyebrowEmphasis: { fontStyle: 'italic' },
    headline: { color: colors.textPrimary, fontSize: 40, lineHeight: 42, fontWeight: '700', letterSpacing: -1.5, marginBottom: spacing(4) },
    paragraph: { color: colors.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: spacing(6) },
    cta: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing(7),
      paddingVertical: spacing(4),
      borderRadius: radius.full,
    },
    ctaPressed: { transform: [{ scale: 0.96 }] },
    ctaText: { color: '#0A0A0A', fontSize: 15, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: spacing(6), marginTop: spacing(8) },
    statItem: { gap: spacing(1) },
    statValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
    statLabel: { color: colors.textSecondary, fontSize: 11 },
  })
}
