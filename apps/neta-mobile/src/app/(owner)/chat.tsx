import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { type Href, router } from 'expo-router';

import type { ChatMessage, ChatMessageMutationPayload, ChatSession } from '@neta/api-contracts';

import { Badge, Button, Card, EmptyState, Screen, Skeleton, TextField, Toast } from '@/components/ui';
import { createChatSession, deleteChatSession, listChatMessages, listChatSessions, streamChatMessage } from '@/features/chat/api';
import { createChatStreamRequest, type ChatStreamRequest } from '@/features/chat/stream';
import { isNearChatEnd } from '@/features/chat/scroll-policy';
import { recordScrollFrame } from '@/lib/performance/metrics';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { clearResourceCacheForResource } from '@/lib/resource/resource-cache';
import { useAppEnvironment } from '@/providers/app-environment-provider';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

const STREAM_TIMEOUT_MS = 45_000;

export default function ChatScreen() {
  const { colors, reduceMotion } = useTheme();
  const { isOnline } = useAppEnvironment();
  const session = useSession();
  const locale = session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr';
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [active, setActive] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState('');
  const [error, setError] = useState<NetaClientError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastRequest, setLastRequest] = useState<ChatStreamRequest | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const composerRef = useRef<TextInput>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const streamingAssistantIdRef = useRef<string | null>(null);
  const lastLocalMessageIdsRef = useRef<{ assistantId: string; userId: string } | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const loadSessions = useCallback(async () => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') return;
    setIsLoading(true); setError(null);
    try {
      const next = (await listChatSessions(session.instance, session.user)).data.items;
      setSessions(next);
      setActive((current) => current ?? next[0] ?? null);
    } catch (loadError) { setError(toClientError(loadError, 'Sohbetler alınamadı.')); }
    finally { setIsLoading(false); }
  }, [session]);
  useEffect(() => { const id = setTimeout(() => void loadSessions(), 0); return () => clearTimeout(id); }, [loadSessions]);

  const loadMessages = useCallback(async () => {
    if (!active || session.status !== 'authenticated' || session.role !== 'freelancer') { setMessages([]); return; }
    setIsLoading(true); setError(null);
    try { setMessages((await listChatMessages(session.instance, session.user, active.id)).data.items); }
    catch (loadError) { setError(toClientError(loadError, 'Mesajlar alınamadı.')); }
    finally { setIsLoading(false); }
  }, [active, session]);
  useEffect(() => { const id = setTimeout(() => void loadMessages(), 0); return () => clearTimeout(id); }, [loadMessages]);

  const newSession = async () => {
    if (!isOnline || session.status !== 'authenticated' || session.role !== 'freelancer') return;
    setIsLoading(true);
    try { const created = (await createChatSession(session.instance, session.user)).data; setActive(created); setMessages([]); await loadSessions(); composerRef.current?.focus(); }
    catch (createError) { setError(toClientError(createError, 'Sohbet oluşturulamadı.')); }
    finally { setIsLoading(false); }
  };

  const removeSession = (item: ChatSession) => Alert.alert('Sohbeti sil', 'Bu sohbet kalıcı olarak silinsin mi?', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Sil', style: 'destructive', onPress: () => void performDelete(item) }]);
  const performDelete = async (item: ChatSession) => {
    if (!isOnline || session.status !== 'authenticated' || session.role !== 'freelancer') return;
    try { await deleteChatSession(session.instance, session.user, item.id); if (active?.id === item.id) { setActive(null); setMessages([]); } await loadSessions(); }
    catch (deleteError) { setError(toClientError(deleteError, 'Sohbet silinemedi.')); }
  };

  const send = async (retryRequest?: ChatStreamRequest) => {
    if (!isOnline || isStreaming || session.status !== 'authenticated' || session.role !== 'freelancer') return;
    const content = retryRequest?.payload.content ?? composer.trim();
    if (!content) { composerRef.current?.focus(); return; }
    let target = active;
    try {
      if (!target) { target = (await createChatSession(session.instance, session.user)).data; setActive(target); }
      const payload: ChatMessageMutationPayload = retryRequest?.payload ?? { content, sourceLocale: locale };
      const streamRequest = createChatStreamRequest(payload, retryRequest?.idempotencyKey);
      const { idempotencyKey } = streamRequest;
      const userId = `local-user-${Date.now()}`;
      const userMessage: ChatMessage = { content, createdAt: new Date().toISOString(), id: userId, role: 'user', sourceLocale: locale };
      const assistantId = `local-assistant-${Date.now()}`;
      const previousLocalIds = lastLocalMessageIdsRef.current;
      streamingAssistantIdRef.current = assistantId; lastLocalMessageIdsRef.current = { assistantId, userId };
      shouldAutoScrollRef.current = true;
      setMessages((current) => [...(retryRequest && previousLocalIds ? current.filter((message) => message.id !== previousLocalIds.assistantId && message.id !== previousLocalIds.userId) : current), userMessage, { content: '', createdAt: new Date().toISOString(), id: assistantId, role: 'assistant', sourceLocale: null }]);
      setComposer(''); setLastRequest(streamRequest); setError(null); setIsStreaming(true); cancelledRef.current = false;
      const controller = new AbortController(); controllerRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);
      let pendingDelta = ''; let flushTimer: ReturnType<typeof setTimeout> | null = null;
      const flushDelta = () => { if (!pendingDelta) return; const delta = pendingDelta; pendingDelta = ''; setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: message.content + delta } : message)); };
      try {
        const completed = await streamChatMessage(session.instance, session.user, target.id, payload, idempotencyKey, controller.signal, (event) => {
          if (event.type === 'message.delta') { pendingDelta += event.delta; if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = null; flushDelta(); }, 50); }
        });
        if (flushTimer) clearTimeout(flushTimer); flushDelta();
        setMessages((current) => current.map((message) => message.id === assistantId ? completed : message));
        await clearResourceCacheForResource(session.instance.instanceId, 'chat');
        const refreshed = await listChatMessages(session.instance, session.user, target.id); setMessages(refreshed.data.items);
        setLastRequest(null); lastLocalMessageIdsRef.current = null; await loadSessions();
      } finally { if (flushTimer) clearTimeout(flushTimer); clearTimeout(timeout); controllerRef.current = null; streamingAssistantIdRef.current = null; }
    } catch (sendError) {
      if (!cancelledRef.current) setError(toClientError(sendError, 'AI yanıtı oluşturulamadı.'));
    } finally { setIsStreaming(false); }
  };
  const stop = () => { cancelledRef.current = true; controllerRef.current?.abort(); const assistantId = streamingAssistantIdRef.current; if (assistantId) setMessages((current) => current.filter((message) => message.id !== assistantId || message.content.trim().length > 0)); setIsStreaming(false); };

  return <Screen contentStyle={styles.screen}><View style={styles.header}>
    <Badge tone="primary">AI</Badge><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>AI sohbet ve proje riski</Text>
    {!isOnline ? <Toast message="Sohbet ve analiz için internet bağlantısı gerekir." tone="danger" /> : null}
    {error ? <View style={styles.error}><Toast message={error.message} tone="danger" />{lastRequest ? <Button disabled={!isOnline} onPress={() => void send(lastRequest)} variant="secondary">Son mesajı yeniden dene</Button> : null}{error.code === 'SERVICE_UNAVAILABLE' ? <Text style={{ color: colors.textMuted }}>AI sağlayıcı ayarları owner ayarlarından tamamlanmalıdır.</Text> : null}</View> : null}
    <View style={styles.actions}><Button disabled={!isOnline} loading={isLoading} onPress={() => void newSession()}>Yeni sohbet</Button><Button onPress={() => router.push('/project-risk' as Href)} variant="secondary">Proje riski</Button></View>
    <FlatList accessibilityLabel="Sohbet oturumları" contentContainerStyle={styles.sessionList} data={sessions} horizontal keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={styles.sessionItem}><Pressable accessibilityRole="radio" accessibilityState={{ checked: active?.id === item.id }} onPress={() => setActive(item)} style={[styles.sessionButton, { backgroundColor: active?.id === item.id ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}><Text numberOfLines={1} style={{ color: active?.id === item.id ? colors.primaryForeground : colors.text }}>{item.title}</Text></Pressable><Button accessibilityLabel={`${item.title} sohbetini sil`} onPress={() => removeSession(item)} variant="ghost">Sil</Button></View>} showsHorizontalScrollIndicator />
  </View>
  <FlatList accessibilityLabel="Sohbet mesajları" contentContainerStyle={styles.messages} data={messages} initialNumToRender={16} keyExtractor={(item) => item.id} ListEmptyComponent={isLoading ? <Skeleton height={100} /> : <EmptyState title="Mesaj yok" description="Yeni bir sohbet başlat ve mesajını yaz." />} maxToRenderPerBatch={12} onContentSizeChange={() => { if (shouldAutoScrollRef.current) listRef.current?.scrollToEnd({ animated: !reduceMotion && !isStreaming }); }} onScroll={({ nativeEvent, timeStamp }) => { recordScrollFrame('chat-messages', timeStamp); shouldAutoScrollRef.current = isNearChatEnd({ contentHeight: nativeEvent.contentSize.height, offsetY: nativeEvent.contentOffset.y, viewportHeight: nativeEvent.layoutMeasurement.height }); }} ref={listRef} removeClippedSubviews renderItem={({ item }) => <Card accessibilityLiveRegion={item.role === 'assistant' && isStreaming ? 'polite' : 'none'} style={[styles.message, item.role === 'user' && styles.userMessage]}><Text style={[styles.messageRole, { color: colors.textMuted }]}>{item.role === 'user' ? 'Sen' : 'Neta AI'}</Text><Text selectable style={{ color: colors.text }}>{item.content || (isStreaming ? 'Yanıt oluşturuluyor…' : '')}</Text></Card>} scrollEventThrottle={32} windowSize={7} />
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={spacing.md}>
    <View style={[styles.composer, { backgroundColor: colors.background, borderColor: colors.border }]}><TextField accessibilityLabel="AI mesajı" label={`Mesaj (${locale})`} multiline onChangeText={setComposer} ref={composerRef} style={styles.composerInput} value={composer} />{isStreaming ? <Button onPress={stop} variant="secondary">Üretimi durdur</Button> : <Button disabled={!isOnline || !composer.trim()} onPress={() => void send()}>Gönder</Button>}</View>
  </KeyboardAvoidingView>
  </Screen>;
}

const styles = StyleSheet.create({ actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, composer: { borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm, paddingVertical: spacing.sm }, composerInput: { maxHeight: 120, minHeight: 50, textAlignVertical: 'top' }, error: { gap: spacing.sm }, header: { gap: spacing.md }, message: { gap: spacing.xs, maxWidth: '88%' }, messageRole: { fontSize: 12, fontWeight: '800' }, messages: { gap: spacing.sm, paddingVertical: spacing.md }, screen: { gap: spacing.sm, paddingBottom: spacing.sm, paddingTop: spacing.md }, sessionButton: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', maxWidth: 180, minHeight: 48, paddingHorizontal: spacing.md }, sessionItem: { alignItems: 'center', flexDirection: 'row' }, sessionList: { gap: spacing.sm }, title: { fontSize: 28, fontWeight: '900' }, userMessage: { alignSelf: 'flex-end' } });
