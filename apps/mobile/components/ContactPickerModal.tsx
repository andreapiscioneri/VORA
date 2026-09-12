import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Icon } from './Icon'
import { radius, spacing } from '../constants/theme'
import { useTheme } from '../contexts/ThemeContext'
import { haptics } from '../lib/haptics'
import type { Contact } from '@vora/shared/types/contact'

// Simple list-picker modal, same shape as EmployeePickerModal — used wherever
// a screen needs to link a record to a contact (CRM opportunities, tickets, etc.).
export function ContactPickerModal({
  visible,
  onClose,
  contacts,
  selectedId,
  onSelect,
  noneLabel,
}: {
  visible: boolean
  onClose: () => void
  contacts: Contact[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  noneLabel: string
}) {
  const { colors } = useTheme()

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
              <Text style={[styles.rowText, { color: selectedId === null ? colors.primary : colors.textPrimary }]}>{noneLabel}</Text>
              {selectedId === null ? <Icon name="check-square" size={16} color={colors.primary} /> : null}
            </Pressable>
            {contacts.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.row, { backgroundColor: colors.surface }]}
                onPress={() => {
                  haptics.selection()
                  onSelect(c.id)
                  onClose()
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.rowText, { color: selectedId === c.id ? colors.primary : colors.textPrimary }]}>
                  {c.firstName} {c.lastName}
                </Text>
                {selectedId === c.id ? <Icon name="check-square" size={16} color={colors.primary} /> : null}
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
