import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useMarketing } from '../hooks/useMarketing'
import { DetailScreen, StateMessage } from '../components/Screen'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import type { ThemeColors } from '../constants/theme'

const TABS = ['campaigns', 'templates', 'segments', 'automations'] as const
type Tab = (typeof TABS)[number]

export default function MarketingScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const {
    campaigns,
    templates,
    segments,
    automations,
    loading,
    loadingMore,
    error,
    reload,
    campaignsHasMore,
    templatesHasMore,
    segmentsHasMore,
    automationsHasMore,
    loadMoreCampaigns,
    loadMoreTemplates,
    loadMoreSegments,
    loadMoreAutomations,
  } = useMarketing()
  const [tab, setTab] = useState<Tab>('campaigns')

  const hasMore =
    tab === 'campaigns' ? campaignsHasMore : tab === 'templates' ? templatesHasMore : tab === 'segments' ? segmentsHasMore : automationsHasMore
  const loadMore =
    tab === 'campaigns' ? loadMoreCampaigns : tab === 'templates' ? loadMoreTemplates : tab === 'segments' ? loadMoreSegments : loadMoreAutomations

  const rows: { id: string; title: string; subtext: string; badge: string | null }[] =
    tab === 'campaigns'
      ? campaigns.map((c) => ({ id: c.id, title: c.name, subtext: c.subject, badge: t(`modules.marketing.campaignStatus.${c.status}`) }))
      : tab === 'templates'
        ? templates.map((tpl) => ({ id: tpl.id, title: tpl.name, subtext: tpl.subject, badge: null }))
        : tab === 'segments'
          ? segments.map((s) => ({
              id: s.id,
              title: s.name,
              subtext: [s.filter.status, ...(s.filter.tags ?? [])].filter(Boolean).join(' · ') || t('modules.marketing.anyContact'),
              badge: null,
            }))
          : automations.map((a) => ({
              id: a.id,
              title: a.name,
              subtext: t(`modules.marketing.trigger.${a.trigger.type}`),
              badge: a.active ? t('modules.marketing.active') : t('modules.marketing.inactive'),
            }))

  return (
    <DetailScreen title={t('modules.marketing.title')} subtitle={t(`modules.marketing.tab.${tab}`)}>
      <View style={styles.segmented}>
        {TABS.map((tb) => (
          <Pressable
            key={tb}
            style={[styles.segment, tab === tb ? styles.segmentActive : null]}
            onPress={() => setTab(tb)}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === tb }}
            accessibilityLabel={t(`modules.marketing.tab.${tb}`)}
          >
            <Text style={[styles.segmentText, tab === tb ? styles.segmentTextActive : null]} numberOfLines={1}>
              {t(`modules.marketing.tab.${tb}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <StateMessage text={t('modules.marketing.error', { error })} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.marketing.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }) => (
            <View style={styles.row} accessible accessibilityLabel={`${item.title}${item.badge ? `, ${item.badge}` : ''}`}>
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtext ? (
                  <Text style={styles.subtext} numberOfLines={1}>
                    {item.subtext}
                  </Text>
                ) : null}
              </View>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    segmented: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(1),
      marginHorizontal: spacing(5),
      marginBottom: spacing(4),
    },
    segment: { flex: 1, paddingVertical: spacing(2), borderRadius: radius.sm, alignItems: 'center' },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    segmentTextActive: { color: '#0A0A0A' },
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
    footer: { paddingVertical: spacing(4) },
  })
}
