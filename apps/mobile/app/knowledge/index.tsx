import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useKnowledge } from '../../hooks/useKnowledge'
import { DetailScreen, StateMessage, OfflineBanner } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { KnowledgeDocument } from '@vora/shared/types/knowledge'

export default function KnowledgeScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { documents, loading, error, offline, reload } = useKnowledge()

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
      {error ? (
        <StateMessage text={t('modules.knowledge.error', { error })} />
      ) : (
        <>
          {offline ? <OfflineBanner text={t('common.offlineCached')} /> : null}
          <FlatList
            data={documents}
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
                {item.favorite ? <Icon name="flag" size={16} color={colors.warning} /> : null}
                <View style={styles.rowMain}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.subtext} numberOfLines={1}>
                    {item.folder || t('modules.knowledge.noFolder')}
                  </Text>
                </View>
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
  })
}
