import assert from 'node:assert/strict';
import test from 'node:test';

import { createChatStreamRequest, parseNdjsonChunk } from './stream.ts';

test('parses NDJSON events split across native stream chunks', () => {
  const first = parseNdjsonChunk('', '{"type":"message.delta","delta":"Mer');
  assert.equal(first.events.length, 0);
  const second = parseNdjsonChunk(first.remainder, 'haba"}\n{"type":"message.delta","delta":"!"}\n');
  assert.deepEqual(second.events.map((event) => event.type), ['message.delta', 'message.delta']);
  assert.equal(second.remainder, '');
});

test('rejects unknown stream events without exposing payloads', () => {
  assert.throws(() => parseNdjsonChunk('', '{"type":"secret","token":"do-not-show"}\n'), /kontrat/);
});

test('reuses the idempotency key when retrying the same chat request', () => {
  const payload = { content: 'Tekrar dene', sourceLocale: 'tr' };
  const first = createChatStreamRequest(payload);
  const retry = createChatStreamRequest(payload, first.idempotencyKey);
  assert.equal(retry.idempotencyKey, first.idempotencyKey);
});
