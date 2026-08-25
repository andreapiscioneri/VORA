import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { Flag } from '../../components/Flag'
import { radius, spacing } from '../../constants/theme'
import { API_BASE } from '../../lib/api'
import { useTheme, ThemeMode } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n, LOCALE_CODES, LOCALE_NAMES, Locale } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'

const ITEMS = [
  { key: 'contacts', route: '/contacts' },
  { key: 'crm', route: '/crm' },
  { key: 'projects', route: '/projects' },
  { key: 'timesheets', route: '/timesheets' },
  { key: 'helpdesk', route: '/helpdesk' },
  { key: 'knowledge', route: '/knowledge' },
  { key: 'leave', route: '/leave' },
  { key: 'expenses', route: '/expenses' },
  { key: 'employees', route: '/employees' },
  { key: 'social', route: '/social' },
  { key: 'marketing', route: '/marketing' },
  { key: 'website', route: '/website' },
  { key: 'wellbeing', route: '/wellbeing' },
  { key: 'auditLog', route: '/audit-log' },
  { key: 'notifications', route: '/notifications' },
  { key: 'settings', route: '/settings' },
] as const
const THEME_MODES: { mode: ThemeMode; icon: 'monitor' | 'sun' | 'moon' }[] = [
  { mode: 'system', icon: 'monitor' },
  { mode: 'light', icon: 'sun' },
  { mode: 'dark', icon: 'moon' },
]

export default function MoreScreen() {
  const { colors, mode, setMode } = useTheme()
  const { t, locale, setLocale } = useI18n()
  const { logout } = useAuth()
  const router = useRouter()
  const styles = makeStyles(colors)
  const [langPickerOpen, setLangPickerOpen] = useState(false)

  return (
    <Screen title={t('more.title')} subtitle={t('more.subtitle')}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t('more.theme')}</Text>
        <View style={styles.segmented}>
          {THEME_MODES.map(({ mode: m, icon }) => (
            <Pressable
              key={m}
              style={[styles.segment, mode === m ? styles.segmentActive : null]}
              onPress={() => {
                haptics.selection()
                setMode(m)
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
              accessibilityLabel={t(`more.themeOptions.${m}`)}
            >
              <Icon name={icon} size={18} color={mode === m ? '#0A0A0A' : colors.textSecondary} />
              <Text style={[styles.segmentText, mode === m ? styles.segmentTextActive : null]}>{t(`more.themeOptions.${m}`)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('more.language')}</Text>
        <Pressable
          style={[styles.row, styles.rowInline]}
          onPress={() => {
            haptics.tap()
            setLangPickerOpen(true)
          }}
          accessibilityRole="button"
          accessibilityLabel={`${t('more.language')}: ${LOCALE_NAMES[locale]}`}
        >
          <Flag locale={locale} />
          <Text style={[styles.label, styles.rowInlineText, { flex: 1 }]}>{LOCALE_NAMES[locale]}</Text>
          <Icon name="chevron-right" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: spacing(6) }]}>{t('more.title')}</Text>
        {ITEMS.map(({ key, route }) => (
          <Pressable
            key={key}
            style={[styles.row, styles.rowInline]}
            onPress={() => {
              haptics.tap()
              router.push(route)
            }}
            accessibilityRole="button"
            accessibilityLabel={`${t(`more.items.${key}.label`)}, ${t(`more.items.${key}.desc`)}`}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t(`more.items.${key}.label`)}</Text>
              <Text style={styles.desc}>{t(`more.items.${key}.desc`)}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
        <Pressable
          style={[styles.row, styles.rowInline, { marginTop: spacing(6) }]}
          onPress={() => {
            haptics.warning()
            logout()
          }}
          accessibilityRole="button"
          accessibilityLabel={t('auth.logout')}
        >
          <Icon name="log-out" size={18} color={colors.danger} />
          <Text style={[styles.label, styles.rowInlineText, { color: colors.danger, flex: 1 }]}>{t('auth.logout')}</Text>
        </Pressable>

        <Text style={styles.footer}>{t('more.connectedTo', { url: API_BASE })}</Text>
      </ScrollView>

      <Modal visible={langPickerOpen} animationType="slide" transparent onRequestClose={() => setLangPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangPickerOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.sectionLabel}>{t('more.language')}</Text>
            {LOCALE_CODES.map((code: Locale) => (
              <Pressable
                key={code}
                style={[styles.row, styles.rowInline]}
                onPress={() => {
                  haptics.selection()
                  setLocale(code)
                  setLangPickerOpen(false)
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: locale === code }}
              >
                <Flag locale={code} />
                <Text style={[styles.label, styles.rowInlineText, locale === code ? { color: colors.primary } : null]}>
                  {LOCALE_NAMES[code]}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    sectionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing(2) },
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(1),
      marginBottom: spacing(6),
    },
    segment: { flex: 1, paddingVertical: spacing(2), borderRadius: radius.sm, alignItems: 'center', gap: spacing(1) },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    segmentTextActive: { color: '#0A0A0A' },
    row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing(4), marginBottom: spacing(2) },
    rowInline: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    rowInlineText: { marginTop: 0 },
    label: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    desc: { color: colors.textSecondary, fontSize: 13, marginTop: spacing(1) },
    footer: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(6), textAlign: 'center' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing(5),
      paddingBottom: spacing(10),
      maxHeight: '70%',
    },
  })
}
