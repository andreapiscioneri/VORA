import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Icon } from '../components/Icon'
import { GlassCard } from '../components/GlassCard'
import { AmbientBackground } from '../components/AmbientBackground'
import { useAssistant } from '../hooks/useAssistant'
import { useI18n } from '../i18n'
import { useTheme } from '../contexts/ThemeContext'
import { haptics } from '../lib/haptics'
import { radius, spacing } from '../constants/theme'
import type { ThemeColors } from '../constants/theme'
import type { AssistantConversationSummary, AssistantMessage, AssistantToolCall } from '@vora/shared/types/assistant'

type View_ = 'list' | 'chat'
const PROMPT_KEYS = ['organizeDay', 'priorities', 'unanswered', 'upcoming'] as const

export default function AssistantScreen() {
  const { colors } = useTheme()
  const { t } = useI18n()
  const styles = makeStyles(colors)
  const {
    conversations,
    conversationsLoading,
    activeConversation,
    streaming,
    pendingToolCall,
    error,
    setError,
    loadConversations,
    openConversation,
    startNewConversation,
    sendMessage,
    confirmToolCall,
    stopStreaming,
    renameConversation,
    setArchived,
    removeConversation,
  } = useAssistant()

  const [view, setView] = useState<View_>('list')
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [composerText, setComposerText] = useState('')
  const [renameTarget, setRenameTarget] = useState<AssistantConversationSummary | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  function scrollToBottom() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
  }

  async function openNewChat() {
    haptics.tap()
    await startNewConversation(t('assistant.newChat'))
    setView('chat')
    scrollToBottom()
  }

  async function openExisting(summary: AssistantConversationSummary) {
    haptics.tap()
    await openConversation(summary.id)
    setView('chat')
    scrollToBottom()
  }

  function backToList() {
    haptics.tap()
    setView('list')
    loadConversations({ archived: showArchived, query: searchQuery })
  }

  function onSearchChange(text: string) {
    setSearchQuery(text)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => loadConversations({ archived: showArchived, query: text }), 300)
  }

  function selectTab(archived: boolean) {
    haptics.selection()
    setShowArchived(archived)
    loadConversations({ archived, query: searchQuery })
  }

  async function send() {
    const text = composerText.trim()
    if (!text || streaming) return
    setComposerText('')
    await sendMessage(text)
    scrollToBottom()
  }

  async function regenerate(index: number) {
    if (streaming || !activeConversation) return
    const priorUser = [...activeConversation.messages.slice(0, index)].reverse().find((m) => m.role === 'user')
    if (!priorUser) return
    haptics.tap()
    await sendMessage(priorUser.content)
    scrollToBottom()
  }

  function openRowMenu(conv: AssistantConversationSummary) {
    haptics.press()
    const options: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = [
      { text: t('assistant.menu.rename'), onPress: () => { setRenameTarget(conv); setRenameValue(conv.title) } },
    ]
    if (conv.archivedAt) {
      options.push({ text: t('assistant.menu.restore'), onPress: () => setArchived(conv.id, false) })
    } else {
      options.push({ text: t('assistant.menu.archive'), onPress: () => setArchived(conv.id, true) })
    }
    options.push({
      text: t('assistant.menu.delete'),
      style: 'destructive',
      onPress: () =>
        Alert.alert(t('assistant.deleteConfirm.title'), t('assistant.deleteConfirm.body'), [
          { text: t('assistant.deleteConfirm.cancel'), style: 'cancel' },
          { text: t('assistant.deleteConfirm.confirm'), style: 'destructive', onPress: () => removeConversation(conv.id) },
        ]),
    })
    options.push({ text: t('assistant.deleteConfirm.cancel'), style: 'cancel' })
    Alert.alert(conv.title, undefined, options)
  }

  async function commitRename() {
    if (!renameTarget) return
    const title = renameValue.trim()
    const target = renameTarget
    setRenameTarget(null)
    if (title && title !== target.title) await renameConversation(target.id, title)
  }

  function toolCallDescription(toolCall: AssistantToolCall): string {
    const input = toolCall.input as Record<string, unknown>
    if (toolCall.name === 'create_task') return t('assistant.toolConfirm.createTask', { title: String(input.title ?? '') })
    if (toolCall.name === 'create_calendar_event') return t('assistant.toolConfirm.createEvent', { title: String(input.title ?? '') })
    return toolCall.name
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <AmbientBackground />

      <View style={styles.header}>
        {view === 'chat' ? (
          <Pressable onPress={backToList} accessibilityRole="button" hitSlop={8} style={[styles.iconButton, { backgroundColor: colors.surface }]}>
            <Icon name="arrow-left" size={20} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {view === 'chat' ? activeConversation?.title || t('assistant.title') : t('assistant.title')}
          </Text>
          {view === 'list' && <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t('assistant.subtitle')}</Text>}
        </View>
        {view === 'list' ? (
          <Pressable onPress={openNewChat} accessibilityRole="button" hitSlop={8} style={[styles.iconButton, { backgroundColor: colors.surface }]}>
            <Icon name="plus" size={20} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      {view === 'list' ? (
        <View style={styles.flex}>
          <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
              <Icon name="search" size={16} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={onSearchChange}
                placeholder={t('assistant.searchPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
            </View>
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => selectTab(false)}
                style={[styles.tab, !showArchived && { backgroundColor: colors.primary + '1A' }]}
              >
                <Text style={[styles.tabText, { color: !showArchived ? colors.primary : colors.textSecondary }]}>{t('assistant.recent')}</Text>
              </Pressable>
              <Pressable
                onPress={() => selectTab(true)}
                style={[styles.tab, showArchived && { backgroundColor: colors.primary + '1A' }]}
              >
                <Text style={[styles.tabText, { color: showArchived ? colors.primary : colors.textSecondary }]}>{t('assistant.archived')}</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.listContent}>
            <Pressable onPress={openNewChat} style={[styles.newChatButton, { borderColor: colors.primary + '66' }]}>
              <Icon name="plus" size={16} color={colors.primary} />
              <Text style={[styles.newChatText, { color: colors.primary }]}>{t('assistant.newChat')}</Text>
            </Pressable>

            {conversationsLoading ? (
              <ActivityIndicator style={{ marginTop: spacing(6) }} color={colors.primary} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateLabel, { color: colors.textSecondary }]}>{t('assistant.noConversations')}</Text>
                {!showArchived && (
                  <>
                    <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>{t('assistant.emptyStateTitle')}</Text>
                    {PROMPT_KEYS.map((key) => (
                      <Pressable
                        key={key}
                        style={[styles.promptRow, { borderColor: colors.border }]}
                        onPress={async () => {
                          await openNewChat()
                          await sendMessage(t(`assistant.prompts.${key}`))
                          scrollToBottom()
                        }}
                      >
                        <Text style={[styles.promptText, { color: colors.textPrimary }]}>{t(`assistant.prompts.${key}`)}</Text>
                      </Pressable>
                    ))}
                  </>
                )}
              </View>
            ) : (
              conversations.map((conv) => (
                <Pressable key={conv.id} style={styles.convRow} onPress={() => openExisting(conv)}>
                  <View style={styles.convRowText}>
                    <Text style={[styles.convTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {conv.title}
                    </Text>
                    <Text style={[styles.convPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                      {conv.preview || t('assistant.noConversations')}
                    </Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => openRowMenu(conv)} style={styles.convMenuButton}>
                    <Icon name="more-horizontal" size={18} color={colors.textSecondary} />
                  </Pressable>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.messagesContent} onContentSizeChange={scrollToBottom}>
            {(activeConversation?.messages ?? []).map((message, index) => (
              <View key={message.id} style={[styles.messageRow, message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant]}>
                {message.content ? (
                  <View
                    style={[
                      styles.bubble,
                      message.role === 'user'
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                    ]}
                  >
                    <Text selectable style={{ color: message.role === 'user' ? '#0A0A0A' : colors.textPrimary, fontSize: 14, lineHeight: 20 }}>
                      {message.content}
                    </Text>
                  </View>
                ) : null}
                {message.role === 'assistant' && message.content && !streaming ? (
                  <Pressable style={styles.regenerateButton} onPress={() => regenerate(index)} hitSlop={8}>
                    <Icon name="repeat" size={13} color={colors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            ))}

            {streaming && !activeConversation?.messages[activeConversation.messages.length - 1]?.content ? (
              <View style={styles.thinkingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('assistant.thinking')}</Text>
              </View>
            ) : null}

            {pendingToolCall ? (
              <GlassCard style={styles.toolConfirmCard}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 14 }}>{t('assistant.toolConfirm.title')}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: spacing(1) }}>{toolCallDescription(pendingToolCall)}</Text>
                <View style={styles.toolConfirmActions}>
                  <Pressable style={[styles.toolConfirmButton, { borderColor: colors.border }]} onPress={() => confirmToolCall(false)}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t('assistant.toolConfirm.cancel')}</Text>
                  </Pressable>
                  <Pressable style={[styles.toolConfirmButton, { backgroundColor: colors.primary }]} onPress={() => confirmToolCall(true)}>
                    <Text style={{ color: '#0A0A0A', fontSize: 13, fontWeight: '700' }}>{t('assistant.toolConfirm.approve')}</Text>
                  </Pressable>
                </View>
              </GlassCard>
            ) : null}

            {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{t(error)}</Text> : null}
          </ScrollView>

          <View style={[styles.composerRow, { borderColor: colors.border }]}>
            <TextInput
              value={composerText}
              onChangeText={setComposerText}
              placeholder={t('assistant.composerPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[styles.composerInput, { color: colors.textPrimary }]}
              multiline
              editable={!streaming}
            />
            {streaming ? (
              <Pressable style={[styles.sendButton, { backgroundColor: colors.textPrimary }]} onPress={stopStreaming} accessibilityLabel={t('assistant.stop')}>
                <Icon name="square" size={14} color={colors.background} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.sendButton, { backgroundColor: colors.primary, opacity: composerText.trim() ? 1 : 0.4 }]}
                onPress={send}
                disabled={!composerText.trim()}
                accessibilityLabel={t('assistant.send')}
              >
                <Icon name="send" size={16} color="#0A0A0A" />
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      <Modal visible={!!renameTarget} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <Pressable style={styles.renameBackdrop} onPress={() => setRenameTarget(null)}>
          <Pressable style={[styles.renameCard, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 15, marginBottom: spacing(3) }}>{t('assistant.renamePrompt')}</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={[styles.renameInput, { color: colors.textPrimary, borderColor: colors.border }]}
              autoFocus
              onSubmitEditing={commitRename}
            />
            <View style={styles.toolConfirmActions}>
              <Pressable style={[styles.toolConfirmButton, { borderColor: colors.border }]} onPress={() => setRenameTarget(null)}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{t('assistant.deleteConfirm.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.toolConfirmButton, { backgroundColor: colors.primary }]} onPress={commitRename}>
                <Text style={{ color: '#0A0A0A', fontSize: 13, fontWeight: '700' }}>{t('assistant.toolConfirm.approve')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(4), paddingVertical: spacing(3), gap: spacing(2) },
    iconButton: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    headerSubtitle: { fontSize: 11, marginTop: 1 },
    searchRow: { paddingHorizontal: spacing(4), gap: spacing(3) },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), borderRadius: radius.md, paddingHorizontal: spacing(3), paddingVertical: spacing(2.5) },
    searchInput: { flex: 1, fontSize: 14, padding: 0 },
    tabRow: { flexDirection: 'row', gap: spacing(2) },
    tab: { paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: radius.full },
    tabText: { fontSize: 12, fontWeight: '600' },
    listContent: { padding: spacing(4), paddingBottom: spacing(10), gap: spacing(2) },
    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      paddingVertical: spacing(3),
      marginBottom: spacing(2),
    },
    newChatText: { fontSize: 14, fontWeight: '600' },
    emptyState: { alignItems: 'stretch', paddingTop: spacing(6), gap: spacing(2) },
    emptyStateLabel: { fontSize: 13, textAlign: 'center', marginBottom: spacing(4) },
    emptyStateTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing(1) },
    promptRow: { borderWidth: 1, borderRadius: radius.md, padding: spacing(3.5) },
    promptText: { fontSize: 14 },
    convRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(3), gap: spacing(2) },
    convRowText: { flex: 1 },
    convTitle: { fontSize: 14, fontWeight: '600' },
    convPreview: { fontSize: 12, marginTop: 2 },
    convMenuButton: { padding: spacing(2) },
    messagesContent: { padding: spacing(4), gap: spacing(3), flexGrow: 1 },
    messageRow: { maxWidth: '85%' },
    messageRowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    messageRowAssistant: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    bubble: { borderRadius: radius.lg, paddingHorizontal: spacing(4), paddingVertical: spacing(2.5) },
    regenerateButton: { marginTop: spacing(1), padding: spacing(1) },
    thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    toolConfirmCard: { gap: spacing(1) },
    toolConfirmActions: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) },
    toolConfirmButton: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing(2.5), alignItems: 'center' },
    errorText: { fontSize: 12 },
    composerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing(2),
      borderTopWidth: 1,
      padding: spacing(3),
    },
    composerInput: { flex: 1, fontSize: 14, maxHeight: 100, paddingVertical: spacing(2) },
    sendButton: { width: 38, height: 38, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
    renameBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing(6) },
    renameCard: { width: '100%', borderRadius: radius.lg, padding: spacing(5) },
    renameInput: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing(3), paddingVertical: spacing(2.5), fontSize: 14 },
  })
}
