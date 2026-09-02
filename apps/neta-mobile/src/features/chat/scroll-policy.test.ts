import assert from 'node:assert/strict';
import test from 'node:test';
import { isNearChatEnd } from './scroll-policy.ts';

test('keeps streaming auto-scroll active near the newest message', () => {
  assert.equal(isNearChatEnd({ contentHeight: 1200, offsetY: 620, viewportHeight: 500 }), true);
});

test('does not pull the reader away from older messages', () => {
  assert.equal(isNearChatEnd({ contentHeight: 2400, offsetY: 300, viewportHeight: 600 }), false);
});
