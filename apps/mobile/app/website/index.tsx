import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMicroSites } from '../../hooks/useMicroSites'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { SkeletonList } from '../../components/Skeleton'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { MicroSite } from '@vora/shared/types/microsite'

export default function WebsiteScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { sites, loading, loadingMore, error, hasMore, reload, loadMore } = useMicroSites()

  return (
    <DetailScreen
      title={t('modules.website.title')}
      subtitle={t('modules.website.count', { count: sites.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/website/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.website.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={t('modules.website.error', { error })} />
      ) : loading && sites.length === 0 ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={sites}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.website.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: MicroSite }) => (
            <Pressable
              onPress={() => {
                haptics.tap()
                router.push(`/website/${item.id}`)
              }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, /${item.slug}, ${item.published ? t('modules.website.published') : t('modules.website.draft')}`}
            >
              <View style={[styles.swatch, { backgroundColor: item.accentColor }]} />
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
            </Pressable>
          )}
        />
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addButton: { padding: spacing(1) },
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    swatch: { width: 12, height: 12, borderRadius: radius.full, marginRight: spacing(3) },
    rowMain: { flex: 1, marginRight: spacing(3) },
    title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
    subtext: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    badge: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(3) },
    badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
    footer: { paddingVertical: spacing(4) },
  })
}
