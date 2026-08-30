import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useMicroSites } from '../hooks/useMicroSites'
import { DetailScreen, StateMessage } from '../components/Screen'
import { Icon } from '../components/Icon'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import type { ThemeColors } from '../constants/theme'
import type { MicroSite } from '@vora/shared/types/microsite'

const MY_SITE_URL = 'https://andreapiscioneri.netlify.app'
const CREATE_SITE_URL = 'https://vora-gestionale.netlify.app/dashboard/website'

// Read-only, same as the web Website module (§32 §75) and its MicroSite
// generator: viewing/publish-status here, the actual page-block builder
// stays a desktop surface — a touch-first site editor isn't a mobile
// workflow, matching how this app already treats other admin-configuration
// screens (Marketing, Settings) as read-first on mobile.
export default function WebsiteScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { sites, loading, loadingMore, error, hasMore, reload, loadMore } = useMicroSites()

  return (
    <DetailScreen title={t('modules.website.title')} subtitle={t('modules.website.count', { count: sites.length })}>
      {error ? (
        <StateMessage text={t('modules.website.error', { error })} />
      ) : (
        <FlatList
          data={sites}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              <Pressable
                style={styles.linkRow}
                onPress={() => {
                  haptics.tap()
                  Linking.openURL(MY_SITE_URL)
                }}
                accessibilityRole="link"
                accessibilityLabel={`${t('modules.website.mySite')}, ${MY_SITE_URL}`}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.title}>{t('modules.website.mySite')}</Text>
                  <Text style={styles.subtext}>{MY_SITE_URL}</Text>
                </View>
                <Icon name="globe" size={18} color={colors.textSecondary} />
              </Pressable>

              <Pressable
                style={styles.linkRow}
                onPress={() => {
                  haptics.tap()
                  Linking.openURL(CREATE_SITE_URL)
                }}
                accessibilityRole="link"
                accessibilityLabel={t('modules.website.createNew')}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.title}>{t('modules.website.createNew')}</Text>
                </View>
                <Icon name="plus" size={18} color={colors.textSecondary} />
              </Pressable>
            </>
          }
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.website.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: MicroSite }) => (
            <View
              style={styles.row}
              accessible
              accessibilityLabel={`${item.name}, /${item.slug}, ${item.published ? t('modules.website.published') : t('modules.website.draft')}`}
            >
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.subtext} numberOfLines={1}>
                  /{item.slug}
                </Text>
              </View>
              <View style={[styles.badge, item.published ? { backgroundColor: colors.primary + '26' } : null]}>
                <Text style={[styles.badgeText, item.published ? { color: colors.primary } : null]}>
                  {item.published ? t('modules.website.published') : t('modules.website.draft')}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      padding: spacing(4),
      marginBottom: spacing(2),
    },
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
    footer: { paddingVertical: spacing(4) },
  })
}
