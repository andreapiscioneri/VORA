import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useEmployees } from '../hooks/useEmployees'
import { DetailScreen, StateMessage } from '../components/Screen'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import type { ThemeColors } from '../constants/theme'
import type { Employee } from '@vora/shared/types/employee'

interface Row {
  employee: Employee
  depth: number
}

// Flattens the manager/report tree depth-first so a plain FlatList can render
// it — indentation (depth * spacing) stands in for the connecting lines a
// real chart would draw. Employees whose managerId points nowhere (deleted
// manager, or genuinely a root) fall back to depth 0 rather than vanishing.
function buildRows(employees: Employee[]): Row[] {
  const byManager = new Map<string | null, Employee[]>()
  const ids = new Set(employees.map((e) => e.id))
  for (const e of employees) {
    const key = e.managerId && ids.has(e.managerId) ? e.managerId : null
    if (!byManager.has(key)) byManager.set(key, [])
    byManager.get(key)!.push(e)
  }

  const rows: Row[] = []
  function visit(managerId: string | null, depth: number) {
    const children = byManager.get(managerId) ?? []
    for (const child of children) {
      rows.push({ employee: child, depth })
      visit(child.id, depth + 1)
    }
  }
  visit(null, 0)
  return rows
}

export default function OrgChartScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const router = useRouter()
  const styles = makeStyles(colors)
  const { employees, loading, error } = useEmployees()

  const rows = buildRows(employees)

  return (
    <DetailScreen title={t('modules.orgChart.title')} subtitle={t('modules.orgChart.subtitle')}>
      {error ? (
        <StateMessage text={t('modules.orgChart.error', { error })} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.employee.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={!loading ? <StateMessage text={t('modules.orgChart.empty')} /> : null}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                haptics.tap()
                router.push(`/employees/${item.employee.id}`)
              }}
              style={[styles.row, { marginLeft: item.depth * spacing(6) }]}
              accessibilityRole="button"
              accessibilityLabel={`${item.employee.firstName} ${item.employee.lastName}, ${item.employee.role}`}
            >
              {item.depth > 0 ? <View style={styles.branch} /> : null}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.employee.firstName.charAt(0)}
                  {item.employee.lastName.charAt(0)}
                </Text>
              </View>
              <View style={styles.rowMain}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.employee.firstName} {item.employee.lastName}
                </Text>
                {item.employee.role ? (
                  <Text style={styles.role} numberOfLines={1}>
                    {item.employee.role}
                  </Text>
                ) : null}
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
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(3),
      marginBottom: spacing(2),
      gap: spacing(3),
    },
    branch: { width: 12, height: 1.5, backgroundColor: colors.border, marginLeft: -spacing(3) },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    rowMain: { flex: 1 },
    name: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
    role: { color: colors.textSecondary, fontSize: 12, marginTop: spacing(0.5) },
  })
}
