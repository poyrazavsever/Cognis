import Constants from 'expo-constants';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';

import {
  createIdempotencyKey,
  isChatMessage,
  isChatSession,
  isDeleteResult,
  isPaginatedResponse,
  isProjectRiskAnalysis,
  type ChatMessage,
  type ChatMessageMutationPayload,
  type ChatSession,
  type ChatStreamEvent,
  type DeleteResult,
  type PaginatedResponse,
  type ProjectRiskAnalysis,
} from '@neta/api-contracts';

import { NetaClientError, upstreamErrorMessage } from '@/lib/api/errors';
import { createApiUrl } from '@/lib/api/http';
import { getNativeAuthHeaders } from '@/lib/auth/native-auth-client';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';
import { parseNdjsonChunk } from './stream.ts';

export function listChatSessions(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<PaginatedResponse<ChatSession>>> {
  return requestResource(instance, user, { cachePolicy: 'short', parser: parseSessionPage, path: 'chat/sessions', resource: 'chat' });
}

export function createChatSession(instance: StoredInstance, user: MeProfile, title?: string): Promise<ResourceResult<ChatSession>> {
  return requestResource(instance, user, { body: { title: title?.trim() || null }, idempotencyKey: createIdempotencyKey('chat-session'), method: 'POST', parser: parseSession, path: 'chat/sessions', resource: 'chat' });
}

export function deleteChatSession(instance: StoredInstance, user: MeProfile, id: string): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, { method: 'DELETE', parser: parseDelete, path: `chat/sessions/${encodeURIComponent(id)}`, resource: 'chat' });
}

export function listChatMessages(instance: StoredInstance, user: MeProfile, id: string): Promise<ResourceResult<PaginatedResponse<ChatMessage>>> {
  return requestResource(instance, user, { cachePolicy: 'short', filters: { id }, parser: parseMessagePage, path: `chat/sessions/${encodeURIComponent(id)}/messages`, resource: 'chat' });
}

export function analyzeProjectRisk(instance: StoredInstance, user: MeProfile, projectId: string): Promise<ResourceResult<ProjectRiskAnalysis>> {
  return requestResource(instance, user, { body: {}, idempotencyKey: createIdempotencyKey('project-risk'), method: 'POST', parser: parseRisk, path: `projects/${encodeURIComponent(projectId)}/risk-analysis`, resource: 'projects' });
}

export async function streamChatMessage(
  instance: StoredInstance,
  user: MeProfile,
  sessionId: string,
  payload: ChatMessageMutationPayload,
  idempotencyKey: string,
  signal: AbortSignal,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<ChatMessage> {
  const authHeaders = await getNativeAuthHeaders(instance.instanceId);
  const response = await expoFetch(createApiUrl(instance.apiBaseUrl, `chat/sessions/${encodeURIComponent(sessionId)}/messages`), {
    body: JSON.stringify(payload),
    credentials: 'include',
    headers: {
      Accept: 'application/x-ndjson',
      'Accept-Language': user.preferences?.locale ?? instance.defaultLocale,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'X-Neta-Client': 'mobile',
      'X-Neta-Client-Version': Constants.expoConfig?.version ?? '0.0.0',
      'X-Neta-Platform': Platform.OS,
      ...authHeaders,
    },
    method: 'POST',
    signal,
  });

  if (!response.ok) throw streamHttpError(response.status);
  if (!response.body) throw new NetaClientError('UPSTREAM_ERROR', upstreamErrorMessage('UPSTREAM_ERROR'));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let remainder = '';
  let completed: ChatMessage | null = null;
  while (true) {
    const part = await reader.read();
    const parsed = parseNdjsonChunk(remainder, part.done ? decoder.decode() : decoder.decode(part.value, { stream: true }), part.done);
    remainder = parsed.remainder;
    for (const event of parsed.events) {
      if (event.type === 'error') throw new NetaClientError(event.code, upstreamErrorMessage(event.code));
      if (event.type === 'message.completed') {
        if (event.message.role !== 'user' && event.message.role !== 'assistant') continue;
        completed = event.message;
      }
      onEvent(event);
    }
    if (part.done) break;
  }
  if (!completed) throw new NetaClientError('UPSTREAM_ERROR', 'AI akışı tamamlanmadan kesildi.');
  return completed;
}

function parseSessionPage(value: unknown): PaginatedResponse<ChatSession> { if (!isPaginatedResponse(value, isChatSession)) throw contractError('Chat sessions'); return value; }
function parseSession(value: unknown): ChatSession { if (!isChatSession(value)) throw contractError('Chat session'); return value; }
function parseMessagePage(value: unknown): PaginatedResponse<ChatMessage> {
  if (!isPaginatedResponse(value, isChatMessage)) throw contractError('Chat messages');
  return { ...value, items: value.items.filter((message) => message.role === 'user' || message.role === 'assistant') };
}
function parseDelete(value: unknown): DeleteResult { if (!isDeleteResult(value)) throw contractError('Chat delete'); return value; }
function parseRisk(value: unknown): ProjectRiskAnalysis { if (!isProjectRiskAnalysis(value)) throw contractError('Project risk'); return value; }
function contractError(name: string): NetaClientError { return new NetaClientError('SERVER_ERROR', `${name} API kontratı beklenen formatta değil.`); }
function streamHttpError(status: number): NetaClientError {
  if (status === 408 || status === 504) return new NetaClientError('UPSTREAM_TIMEOUT', upstreamErrorMessage('UPSTREAM_TIMEOUT'), status);
  if (status === 503 || status === 424) return new NetaClientError('SERVICE_UNAVAILABLE', upstreamErrorMessage('SERVICE_UNAVAILABLE'), status);
  return new NetaClientError('UPSTREAM_ERROR', upstreamErrorMessage('UPSTREAM_ERROR'), status);
}
