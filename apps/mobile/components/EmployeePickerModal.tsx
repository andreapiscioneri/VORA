import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../i18n'
import { haptics } from '../lib/haptics'
import type { Employee } from '@vora/shared/types/employee'

// Simple list-picker modal, same shape as the language picker in AppMenu/more.tsx
// — used wherever a screen needs to link one employee to another (manager, etc.)
// without a dedicated dropdown component in this codebase.
export function EmployeePickerModal({
  visible,
  onClose,
  employees,
  excludeId,
  selectedId,
  onSelect,
}: {
  visible: boolean
  onClose: () => void
  employees: Employee[]
  excludeId?: string
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const { colors } = useTheme()
  const { t } = useI18n()
  const options = employees.filter((e) => e.id !== excludeId)

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <ScrollView>
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface }]}
              onPress={() => {
                haptics.selection()
                onSelect(null)
                onClose()
              }}
              accessibilityRole="button"
            >
              <Text style={[styles.rowText, { color: selectedId === null ? colors.primary : colors.textPrimary }]}>
                {t('modules.employees.form.managerNone')}
              </Text>
              {selectedId === null ? <Icon name="check-square" size={16} color={colors.primary} /> : null}
            </Pressable>
            {options.map((e) => (
              <Pressable
                key={e.id}
                style={[styles.row, { backgroundColor: colors.surface }]}
                onPress={() => {
                  haptics.selection()
                  onSelect(e.id)
                  onClose()
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.rowText, { color: selectedId === e.id ? colors.primary : colors.textPrimary }]}>
                  {e.firstName} {e.lastName}
                </Text>
                {selectedId === e.id ? <Icon name="check-square" size={16} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing(5), paddingBottom: spacing(10), maxHeight: '70%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    marginBottom: spacing(2),
  },
  rowText: { fontSize: 15, fontWeight: '600' },
})
