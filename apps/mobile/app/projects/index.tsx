import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useProjects } from '../../hooks/useProjects'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { Project } from '@vora/shared/types/project'

export default function ProjectsScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { projects, loading, loadingMore, error, hasMore, reload, loadMore } = useProjects()

  return (
    <DetailScreen
      title={t('modules.projects.title')}
      subtitle={t('modules.projects.count', { count: projects.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/projects/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.projects.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={t('modules.projects.error', { error })} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.projects.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: Project }) => (
            <Pressable
              onPress={() => {
                haptics.tap()
                router.push(`/projects/${item.id}`)
              }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${t(`modules.projects.status.${item.status}`)}`}
            >
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.dueDate ? <Text style={styles.subtext}>{item.dueDate}</Text> : null}
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(`modules.projects.status.${item.status}`)}</Text>
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
    rowMain: { flex: 1, marginRight: spacing(3) },
    title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
    subtext: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    badge: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(3) },
    badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
    footer: { paddingVertical: spacing(4) },
  })
}
