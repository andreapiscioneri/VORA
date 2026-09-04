import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useLeaveRequests } from '../../hooks/useLeaveRequests'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { LeaveRequest } from '@vora/shared/types/leave'

export default function LeaveScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { requests, loading, loadingMore, error, hasMore, reload, loadMore } = useLeaveRequests()

  return (
    <DetailScreen
      title={t('modules.leave.title')}
      subtitle={t('modules.leave.count', { count: requests.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/leave/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.leave.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={t('modules.leave.error', { error })} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.leave.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: LeaveRequest }) => (
            <Pressable
              onPress={() => {
                haptics.tap()
                router.push(`/leave/${item.id}`)
              }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${item.requesterName}, ${t(`modules.leave.type.${item.type}`)}, ${item.startDate} - ${item.endDate}, ${t(`modules.leave.status.${item.status}`)}`}
            >
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.requesterName}
                </Text>
                <Text style={styles.subtext}>
                  {t(`modules.leave.type.${item.type}`)} · {item.startDate} → {item.endDate}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(`modules.leave.status.${item.status}`)}</Text>
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
