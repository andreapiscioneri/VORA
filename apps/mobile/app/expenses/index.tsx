import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useExpenses } from '../../hooks/useExpenses'
import { DetailScreen, StateMessage, OfflineBanner } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { Expense, ExpenseStatus } from '@vora/shared/types/expense'

const STATUS_COLOR: Record<ExpenseStatus, keyof ThemeColors> = {
  pending: 'warning',
  approved: 'primary',
  rejected: 'danger',
}

export default function ExpensesScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { expenses, loading, loadingMore, error, offline, hasMore, reload, loadMore } = useExpenses()

  return (
    <DetailScreen
      title={t('modules.expenses.title')}
      subtitle={t('modules.expenses.count', { count: expenses.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/expenses/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.expenses.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={t('modules.expenses.error', { error })} />
      ) : (
        <>
          {offline ? <OfflineBanner text={t('common.offlineCached')} /> : null}
          <FlatList
            data={expenses}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
            ListEmptyComponent={!loading ? <StateMessage text={t('modules.expenses.empty')} /> : null}
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
            renderItem={({ item }: { item: Expense }) => (
              <Pressable
                onPress={() => {
                  haptics.tap()
                  router.push(`/expenses/${item.id}`)
                }}
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={`${t(`modules.expenses.category.${item.category}`)}, ${item.amount} ${item.currency}, ${item.date}, ${t(`modules.expenses.status.${item.status}`)}`}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.title} numberOfLines={1}>
                    {t(`modules.expenses.category.${item.category}`)} · {item.amount} {item.currency}
                  </Text>
                  <Text style={styles.subtext} numberOfLines={1}>
                    {item.date}
                    {item.notes ? ` · ${item.notes}` : ''}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors[STATUS_COLOR[item.status]] + '26' }]}>
                  <Text style={[styles.badgeText, { color: colors[STATUS_COLOR[item.status]] }]}>
                    {t(`modules.expenses.status.${item.status}`)}
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
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    rowMain: { flex: 1, marginRight: spacing(3) },
    title: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
    subtext: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(1) },
    badge: { borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(3) },
    badgeText: { fontSize: 11, fontWeight: '600' },
    footer: { paddingVertical: spacing(4) },
  })
}
