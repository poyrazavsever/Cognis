import { createIdempotencyKey, isChatStreamEvent, type ChatMessageMutationPayload, type ChatStreamEvent } from '@neta/api-contracts';

import { NetaClientError } from '../../lib/api/errors.ts';

export type ChatStreamRequest = { idempotencyKey: string; payload: ChatMessageMutationPayload };

export function createChatStreamRequest(payload: ChatMessageMutationPayload, idempotencyKey?: string): ChatStreamRequest {
  return { idempotencyKey: idempotencyKey ?? createIdempotencyKey('chat-message'), payload };
}

export function parseNdjsonChunk(remainder: string, chunk: string, flush = false): { events: ChatStreamEvent[]; remainder: string } {
  const combined = remainder + chunk;
  const lines = combined.split('\n');
  const nextRemainder = flush ? '' : (lines.pop() ?? '');
  if (flush && lines.at(-1)?.trim() === '') lines.pop();
  const events = lines.filter((line) => line.trim()).map((line) => {
    let value: unknown;
    try { value = JSON.parse(line); } catch { throw new NetaClientError('UPSTREAM_ERROR', 'AI akışı geçersiz veri döndürdü.'); }
    if (!isChatStreamEvent(value)) throw new NetaClientError('UPSTREAM_ERROR', 'AI akış kontratı geçersiz.');
    return value;
  });
  return { events, remainder: nextRemainder };
}
