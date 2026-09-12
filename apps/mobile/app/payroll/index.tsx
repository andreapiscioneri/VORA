import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { usePayroll } from '../../hooks/usePayroll'
import { DetailScreen, StateMessage } from '../../components/Screen'
import { SkeletonList } from '../../components/Skeleton'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { PayrollRecord } from '@vora/shared/types/payroll'

export default function PayrollScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { records, loading, loadingMore, error, hasMore, reload, loadMore } = usePayroll()

  return (
    <DetailScreen
      title={t('modules.payroll.title')}
      subtitle={t('modules.payroll.count', { count: records.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/payroll/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.payroll.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      <Text style={styles.disclaimer}>{t('modules.payroll.disclaimer')}</Text>
      {error ? (
        <StateMessage text={t('modules.payroll.error', { error })} />
      ) : loading && records.length === 0 ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.payroll.empty')} /> : null}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
          renderItem={({ item }: { item: PayrollRecord }) => (
            <Pressable
              onPress={() => {
                haptics.tap()
                router.push(`/payroll/${item.id}`)
              }}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={`${item.employeeName}, ${item.period}, ${t(`modules.payroll.status.${item.status}`)}`}
            >
              <View style={styles.rowMain}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.employeeName}
                </Text>
                <Text style={styles.subtext} numberOfLines={1}>
                  {item.period} · {t('modules.payroll.net', { amount: item.netAmount.toFixed(2) })}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(`modules.payroll.status.${item.status}`)}</Text>
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
    disclaimer: {
      color: colors.textSecondary,
      fontSize: 12,
      paddingHorizontal: spacing(5),
      paddingBottom: spacing(3),
    },
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
