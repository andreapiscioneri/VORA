import { useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useKnowledge } from '../../hooks/useKnowledge'
import { DetailScreen, StateMessage, OfflineBanner } from '../../components/Screen'
import { SkeletonList } from '../../components/Skeleton'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { KnowledgeDocument, KnowledgeSearchResult } from '@vora/shared/types/knowledge'

export default function KnowledgeScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { documents, loading, error, offline, reload, toggleFavorite, searchDocuments } = useKnowledge()

  const [query, setQuery] = useState('')
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [semanticResults, setSemanticResults] = useState<KnowledgeSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  const folders = useMemo(() => Array.from(new Set(documents.map((d) => d.folder).filter(Boolean))), [documents])
  const scoreById = useMemo(() => new Map((semanticResults ?? []).map((r) => [r.document.id, r.score])), [semanticResults])

  const filtered = useMemo(() => {
    const base = semanticResults ? semanticResults.map((r) => r.document) : documents
    const q = semanticResults ? '' : query.trim().toLowerCase()
    return base.filter((d) => {
      if (favoritesOnly && !d.favorite) return false
      if (folderFilter && d.folder !== folderFilter) return false
      if (!q) return true
      return [d.title, d.content, ...d.tags].join(' ').toLowerCase().includes(q)
    })
  }, [documents, semanticResults, query, favoritesOnly, folderFilter])

  async function runSemanticSearch() {
    haptics.tap()
    if (!query.trim()) {
      setSemanticResults(null)
      return
    }
    setSearching(true)
    try {
      setSemanticResults(await searchDocuments(query))
    } finally {
      setSearching(false)
    }
  }

  function onChangeQuery(value: string) {
    setQuery(value)
    if (!value.trim()) setSemanticResults(null)
  }

  return (
    <DetailScreen
      title={t('modules.knowledge.title')}
      subtitle={t('modules.knowledge.count', { count: documents.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/knowledge/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.knowledge.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={onChangeQuery}
          onSubmitEditing={runSemanticSearch}
          placeholder={t('modules.knowledge.search')}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
        />
        <Pressable
          onPress={runSemanticSearch}
          disabled={searching}
          style={styles.searchButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.knowledge.semanticSearch')}
        >
          <Icon name="search" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Pressable
          style={[styles.chip, folderFilter === null ? styles.chipActive : null]}
          onPress={() => {
            haptics.selection()
            setFolderFilter(null)
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: folderFilter === null }}
        >
          <Text style={[styles.chipText, folderFilter === null ? styles.chipTextActive : null]}>{t('modules.knowledge.allFolders')}</Text>
        </Pressable>
        {folders.map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, folderFilter === f ? styles.chipActive : null]}
            onPress={() => {
              haptics.selection()
              setFolderFilter(f)
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: folderFilter === f }}
          >
            <Text style={[styles.chipText, folderFilter === f ? styles.chipTextActive : null]}>{f}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.chip, favoritesOnly ? styles.chipActive : null]}
          onPress={() => {
            haptics.selection()
            setFavoritesOnly((v) => !v)
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: favoritesOnly }}
        >
          <Icon name="flag" size={13} color={favoritesOnly ? '#0A0A0A' : colors.textSecondary} />
          <Text style={[styles.chipText, styles.chipTextWithIcon, favoritesOnly ? styles.chipTextActive : null]}>
            {t('modules.knowledge.favoritesOnly')}
          </Text>
        </Pressable>
      </ScrollView>

      {semanticResults ? (
        <Text style={styles.semanticInfo}>
          {searching ? t('modules.knowledge.searching') : t('modules.knowledge.semanticResultsCount', { count: semanticResults.length })}
        </Text>
      ) : null}

      {error ? (
        <StateMessage text={t('modules.knowledge.error', { error })} />
      ) : loading && documents.length === 0 ? (
        <SkeletonList />
      ) : (
        <>
          {offline ? <OfflineBanner text={t('common.offlineCached')} /> : null}
          <FlatList
            data={filtered}
            keyExtractor={(d) => d.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
            ListEmptyComponent={!loading ? <StateMessage text={t('modules.knowledge.empty')} /> : null}
            renderItem={({ item }: { item: KnowledgeDocument }) => (
              <Pressable
                onPress={() => {
                  haptics.tap()
                  router.push(`/knowledge/${item.id}`)
                }}
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.folder || ''}`}
              >
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation()
                    haptics.selection()
                    toggleFavorite(item)
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={item.favorite ? t('modules.knowledge.unfavorite') : t('modules.knowledge.favorite')}
                >
                  <Icon name="flag" size={16} color={item.favorite ? colors.warning : colors.border} />
                </Pressable>
                <View style={styles.rowMain}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.subtext} numberOfLines={1}>
                    {item.folder || t('modules.knowledge.noFolder')}
                  </Text>
                </View>
                {scoreById.has(item.id) ? (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>{t('modules.knowledge.relevance', { pct: Math.round((scoreById.get(item.id) ?? 0) * 100) })}</Text>
                  </View>
                ) : null}
              </Pressable>
            )}
          />
        </>
      )}
    </DetailScreen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addButton: { padding: spacing(1) },
    searchRow: { flexDirection: 'row', gap: spacing(2), paddingHorizontal: spacing(5), marginBottom: spacing(3) },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2.5),
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    searchButton: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipRow: { paddingHorizontal: spacing(5), gap: spacing(2), paddingBottom: spacing(3) },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingVertical: spacing(2),
      paddingHorizontal: spacing(3),
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    chipTextWithIcon: { marginLeft: spacing(1) },
    chipTextActive: { color: '#0A0A0A' },
    semanticInfo: { color: colors.textSecondary, fontSize: 12, paddingHorizontal: spacing(5), marginBottom: spacing(2) },
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    rowMain: { flex: 1 },
    title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
    subtext: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    scoreBadge: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(2) },
    scoreBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '600' },
  })
}
