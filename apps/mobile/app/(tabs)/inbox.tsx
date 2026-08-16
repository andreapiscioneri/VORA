import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useInbox } from '../../hooks/useInbox'
import { Screen, StateMessage } from '../../components/Screen'
import { radius, spacing } from '../../constants/theme'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n'
import type { ThemeColors } from '../../constants/theme'
import type { Communication } from '@vora/shared/types/communication'

export default function InboxScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const { items, loading, error, reload, markRead } = useInbox()
  const channelLabel = (channel: string) => t(`inbox.channels.${channel}`) || channel

  return (
    <Screen title={t('inbox.title')} subtitle={t('inbox.count', { count: items.filter((i) => i.status === 'unread').length })}>
      {error ? (
        <StateMessage text={t('inbox.error', { error })} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
          ListEmptyComponent={!loading ? <StateMessage text={t('inbox.empty')} /> : null}
          renderItem={({ item }: { item: Communication }) => {
            const isUnread = item.status === 'unread'
            const channel = channelLabel(item.channel)
            return (
              <Pressable
                style={[styles.row, isUnread ? styles.rowUnread : null]}
                onPress={() => isUnread && markRead(item)}
                accessibilityRole="button"
                accessibilityLabel={`${isUnread ? t('inbox.unreadPrefix') : ''}${channel}, ${item.subject || t('inbox.noSubject')}`}
                accessibilityHint={isUnread ? t('inbox.markReadHint') : undefined}
              >
                <View style={styles.rowTop}>
                  <Text style={styles.channel}>{channel}</Text>
                  {isUnread && <View style={styles.dot} accessibilityElementsHidden importantForAccessibility="no" />}
                </View>
                <Text style={styles.subject} numberOfLines={1}>
                  {item.subject || `(${t('inbox.noSubject')})`}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                  {item.body}
                </Text>
              </Pressable>
            )
          }}
        />
      )}
    </Screen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
    row: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing(4),
      marginBottom: spacing(2),
    },
    rowUnread: { borderWidth: 1, borderColor: colors.primaryMuted },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1) },
    channel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    subject: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: spacing(1) },
    body: { color: colors.textSecondary, fontSize: 13 },
  })
}
