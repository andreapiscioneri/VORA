import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { DetailScreen, StateMessage } from '../components/Screen'
import { useSearch } from '../hooks/useSearch'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import type { ThemeColors } from '../constants/theme'
import type { SearchResult, SearchResultType } from '@vora/shared/types/search'

// Mirrors the destinations the web command palette uses (server/api/search.get.ts's
// `to` field), but pointed at mobile's own routes where a detail screen exists —
// mobile has per-record edit screens web's shallow list links don't need.
// 'appointment' has no mobile screen at all yet (a separate module from the
// Calendar/CalendarEvent one built today), so those results show but don't navigate.
function routeFor(result: SearchResult): string | null {
  switch (result.type) {
    case 'contact':
      return `/contacts/${result.id}`
    case 'task':
      return `/tasks/${result.id}`
    case 'ticket':
      return `/helpdesk/${result.id}`
    case 'project':
      return `/projects/${result.id}`
    case 'knowledge':
      return `/knowledge/${result.id}`
    case 'communication':
      return '/inbox'
    case 'appointment':
      return null
  }
}

export default function SearchScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { query, setQuery, results, loading, error, minLength } = useSearch()

  return (
    <DetailScreen title={t('search.title')}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textSecondary}
          autoFocus
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {error ? (
        <StateMessage text={t('search.error')} />
      ) : loading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : query.trim().length < minLength ? (
        <StateMessage text={t('search.tooShort')} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => `${r.type}-${r.id}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<StateMessage text={t('search.empty')} />}
          renderItem={({ item }: { item: SearchResult }) => {
            const to = routeFor(item)
            return (
              <Pressable
                onPress={
                  to
                    ? () => {
                        haptics.tap()
                        router.push(to as never)
                      }
                    : undefined
                }
                style={styles.row}
                accessibilityRole={to ? 'button' : undefined}
                accessibilityLabel={`${item.title}, ${item.subtitle}`}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.subtext} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t(`search.types.${item.type as SearchResultType}`)}</Text>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    searchBar: { paddingHorizontal: spacing(5), marginBottom: spacing(4) },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(3),
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      fontSize: 15,
    },
    loading: { marginTop: spacing(8) },
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    rowMain: { flex: 1, marginRight: spacing(3) },
    title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
    subtext: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    badge: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(3) },
    badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
  })
}
