import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useEmployees } from '../../hooks/useEmployees'
import { DetailScreen, StateMessage, OfflineBanner } from '../../components/Screen'
import { Icon } from '../../components/Icon'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import { haptics } from '../../lib/haptics'
import type { ThemeColors } from '../../constants/theme'
import type { Employee } from '@vora/shared/types/employee'

export default function EmployeesScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { employees, loading, loadingMore, error, offline, hasMore, reload, loadMore } = useEmployees()

  return (
    <DetailScreen
      title={t('modules.employees.title')}
      subtitle={t('modules.employees.count', { count: employees.length })}
      headerRight={
        <Pressable
          onPress={() => {
            haptics.tap()
            router.push('/employees/new')
          }}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel={t('modules.employees.form.newTitle')}
          hitSlop={12}
        >
          <Icon name="plus" size={22} color={colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <StateMessage text={t('modules.employees.error', { error })} />
      ) : (
        <>
          {offline ? <OfflineBanner text={t('common.offlineCached')} /> : null}
          <FlatList
            data={employees}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
            ListEmptyComponent={!loading ? <StateMessage text={t('modules.employees.empty')} /> : null}
            onEndReached={hasMore ? loadMore : undefined}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
            renderItem={({ item }: { item: Employee }) => (
              <Pressable
                onPress={() => {
                  haptics.tap()
                  router.push(`/employees/${item.id}`)
                }}
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={`${item.firstName} ${item.lastName}, ${item.role}, ${item.team}, ${t(`modules.employees.status.${item.status}`)}`}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.subtext} numberOfLines={1}>
                    {[item.role, item.team].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t(`modules.employees.status.${item.status}`)}</Text>
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
    badge: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing(1), paddingHorizontal: spacing(3) },
    badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
    footer: { paddingVertical: spacing(4) },
  })
}
