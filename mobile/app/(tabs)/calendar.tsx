import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useEvents } from '../../hooks/useEvents'
import { Screen, StateMessage, OfflineBanner } from '../../components/Screen'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n, Locale } from '../../i18n'
import type { ThemeColors } from '../../constants/theme'
import type { CalendarEvent } from '@vora/shared/types/event'

const BCP47: Record<Locale, string> = {
  it: 'it-IT',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ja: 'ja-JP',
}

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(BCP47[locale], { day: '2-digit', month: 'short' })
}

function formatTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleTimeString(BCP47[locale], { hour: '2-digit', minute: '2-digit' })
}

export default function CalendarScreen() {
  const { colors } = useTheme()
  const { t, locale } = useI18n()
  const styles = makeStyles(colors)
  const { events, loading, error, offline, reload } = useEvents()

  return (
    <Screen title={t('calendar.title')} subtitle={t('calendar.count', { count: events.length })}>
      {error ? (
        <StateMessage text={t('calendar.error', { error })} />
      ) : (
        <>
          {offline ? <OfflineBanner text={t('common.offlineCached')} /> : null}
          <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('calendar.empty')} /> : null}
          renderItem={({ item }: { item: CalendarEvent }) => (
            <View
              style={styles.row}
              accessible
              accessibilityLabel={`${item.title}, ${formatDate(item.startAt, locale)}${!item.allDay ? ', ' + formatTime(item.startAt, locale) : ''}${item.location ? ', ' + item.location : ''}`}
            >
              <View style={styles.dateCol}>
                <Text style={styles.date}>{formatDate(item.startAt, locale)}</Text>
                {!item.allDay && <Text style={styles.time}>{formatTime(item.startAt, locale)}</Text>}
              </View>
              <View style={styles.mainCol}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.location ? (
                  <Text style={styles.location} numberOfLines={1}>
                    {item.location}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
          />
        </>
      )}
    </Screen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    dateCol: { width: 64, marginRight: spacing(3) },
    date: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    time: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    mainCol: { flex: 1 },
    title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
    location: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
  })
}
