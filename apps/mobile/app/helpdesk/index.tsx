import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTickets } from '../../hooks/useTickets'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { Ticket } from '@vora/shared/types/ticket'

export default function HelpdeskScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { tickets, loading, loadingMore, error, hasMore, reload, loadMore } = useTickets()

  return (
    <DetailScreen
      title={t('modules.helpdesk.title')}
      subtitle={t('modules.helpdesk.count', { count: tickets.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/helpdesk/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.helpdesk.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={t('modules.helpdesk.error', { error })} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(tk) => tk.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.helpdesk.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: Ticket }) => (
            <View style={styles.row} accessible accessibilityLabel={`${item.title}, ${t(`modules.helpdesk.status.${item.status}`)}`}>
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.subtext} numberOfLines={1}>
                  {item.description}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(`modules.helpdesk.status.${item.status}`)}</Text>
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
