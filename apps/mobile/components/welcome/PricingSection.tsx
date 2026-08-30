import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icon } from '../Icon'
import { useI18n } from '../../i18n'
import { useTheme } from '../../contexts/ThemeContext'
import { radius, spacing } from '../../constants/theme'
import type { ThemeColors } from '../../constants/theme'

const PLAN_KEYS = ['starter', 'business', 'enterprise'] as const

export function PricingSection({ onCta }: { onCta: () => void }) {
  const { t } = useI18n()
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{t('welcome.pricing.eyebrow')}</Text>
      <Text style={styles.title}>{t('welcome.pricing.title')}</Text>
      <Text style={styles.subtitle}>{t('welcome.pricing.subtitle')}</Text>

      <View style={styles.list}>
        {PLAN_KEYS.map((key) => {
          const highlighted = key === 'business'
          return (
            <View key={key} style={[styles.card, highlighted && styles.cardHighlighted]}>
              {highlighted && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('welcome.pricing.mostRequested')}</Text>
                </View>
              )}
              <Text style={styles.planName}>{t(`welcome.pricing.plans.${key}.name`)}</Text>
              <Text style={styles.planDescription}>{t(`welcome.pricing.plans.${key}.description`)}</Text>
              <View style={styles.featureList}>
                {[1, 2, 3, 4].map((n) => (
                  <View key={n} style={styles.featureRow}>
                    <Icon name="check-square" size={14} color={colors.primary} />
                    <Text style={styles.featureText}>{t(`welcome.pricing.plans.${key}.feature${n}`)}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={onCta}
                accessibilityRole="button"
                style={({ pressed }) => [styles.cta, highlighted && styles.ctaHighlighted, pressed && styles.pressed]}
              >
                <Text style={[styles.ctaText, highlighted && styles.ctaTextHighlighted]}>
                  {key === 'enterprise' ? t('welcome.pricing.ctaEnterprise') : t('welcome.cta')}
                </Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: { paddingHorizontal: spacing(5), paddingVertical: spacing(10), backgroundColor: colors.surface },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    title: { color: colors.textPrimary, fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -1, marginTop: spacing(2) },
    subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing(3) },
    list: { marginTop: spacing(6), gap: spacing(4) },
    card: {
      padding: spacing(5),
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    cardHighlighted: { borderColor: colors.primary + '80', backgroundColor: colors.primary + '0F' },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(1),
      borderRadius: radius.full,
      marginBottom: spacing(3),
    },
    badgeText: { color: '#0A0A0A', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
    planName: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
    planDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: spacing(1.5) },
    featureList: { marginTop: spacing(4), gap: spacing(2) },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing(2) },
    featureText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
    cta: {
      marginTop: spacing(5),
      alignItems: 'center',
      paddingVertical: spacing(3),
      borderRadius: radius.full,
      backgroundColor: colors.border,
    },
    ctaHighlighted: { backgroundColor: colors.primary },
    ctaText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    ctaTextHighlighted: { color: '#0A0A0A' },
    pressed: { transform: [{ scale: 0.97 }] },
  })
}
