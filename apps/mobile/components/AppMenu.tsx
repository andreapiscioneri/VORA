import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { BrandMark } from './BrandMark'
import { Wordmark } from './Wordmark'
import { Icon } from './Icon'
import { Flag } from './Flag'
import { MODULE_NAV_ITEMS } from '../constants/moduleNav'
import { radius, spacing } from '../constants/theme'
import { useTheme, ThemeMode } from '../contexts/ThemeContext'
import { useI18n, LOCALE_CODES, LOCALE_NAMES, Locale } from '../i18n'
import { haptics } from '../lib/haptics'

const THEME_MODES: { mode: ThemeMode; icon: 'monitor' | 'sun' | 'moon' }[] = [
  { mode: 'system', icon: 'monitor' },
  { mode: 'light', icon: 'sun' },
  { mode: 'dark', icon: 'moon' },
]

// Full-screen drawer reusing the same module list as the "Altro" tab
// (more.tsx) — a shortcut into any module without a tab switch, mirroring
// the public welcome screen's hamburger menu pattern. Also carries the
// theme/language switches so they're reachable from anywhere, not just Altro.
export function AppMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, mode, setMode } = useTheme()
  const { t, locale, setLocale } = useI18n()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [langPickerOpen, setLangPickerOpen] = useState(false)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setMounted(true)
      Animated.timing(anim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false)
      })
    }
  }, [visible])

  if (!mounted) return null

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.overlay,
        { backgroundColor: colors.background, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] },
      ]}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              haptics.press()
              onClose()
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
          >
            <Icon name="x" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.brandRow}>
            <BrandMark size={24} />
            <Wordmark size={18} color={colors.textPrimary} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => {
              haptics.tap()
              onClose()
              router.push('/search')
            }}
            style={[styles.row, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel={t('search.title')}
          >
            <View style={styles.langCurrent}>
              <Icon name="search" size={18} color={colors.textSecondary} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('search.title')}</Text>
            </View>
          </Pressable>

          <View style={[styles.segmented, { backgroundColor: colors.surface }]}>
            {THEME_MODES.map(({ mode: m, icon }) => (
              <Pressable
                key={m}
                style={[styles.segment, mode === m ? { backgroundColor: colors.primary } : null]}
                onPress={() => {
                  haptics.selection()
                  setMode(m)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === m }}
                accessibilityLabel={t(`more.themeOptions.${m}`)}
              >
                <Icon name={icon} size={16} color={mode === m ? '#0A0A0A' : colors.textSecondary} />
                <Text style={[styles.segmentText, { color: mode === m ? '#0A0A0A' : colors.textSecondary }]}>{t(`more.themeOptions.${m}`)}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.row, { backgroundColor: colors.surface }]}
            onPress={() => {
              haptics.tap()
              setLangPickerOpen(true)
            }}
            accessibilityRole="button"
            accessibilityLabel={`${t('more.language')}: ${LOCALE_NAMES[locale]}`}
          >
            <View style={styles.langCurrent}>
              <Flag locale={locale} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{LOCALE_NAMES[locale]}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>

          {MODULE_NAV_ITEMS.map(({ key, route }) => (
            <Pressable
              key={key}
              onPress={() => {
                haptics.tap()
                onClose()
                router.push(route)
              }}
              style={[styles.row, { backgroundColor: colors.surface }]}
              accessibilityRole="button"
            >
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t(`more.items.${key}.label`)}</Text>
              <Icon name="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={langPickerOpen} animationType="slide" transparent onRequestClose={() => setLangPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangPickerOpen(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary, marginBottom: spacing(2) }]}>{t('more.language')}</Text>
            {LOCALE_CODES.map((code: Locale) => (
              <Pressable
                key={code}
                style={[styles.row, { backgroundColor: colors.surface }]}
                onPress={() => {
                  haptics.selection()
                  setLocale(code)
                  setLangPickerOpen(false)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: locale === code }}
              >
                <View style={styles.langCurrent}>
                  <Flag locale={code} />
                  <Text style={[styles.rowLabel, { color: locale === code ? colors.primary : colors.textPrimary }]}>{LOCALE_NAMES[code]}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing(5), paddingTop: spacing(2), paddingBottom: spacing(4) },
  iconButton: { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10), gap: spacing(2) },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: spacing(1), marginBottom: spacing(2) },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing(1), paddingVertical: spacing(2), borderRadius: radius.sm },
  segmentText: { fontSize: 12, fontWeight: '600' },
  langCurrent: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, paddingVertical: spacing(4), paddingHorizontal: spacing(4) },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing(5), paddingBottom: spacing(10), maxHeight: '70%', gap: spacing(2) },
})
