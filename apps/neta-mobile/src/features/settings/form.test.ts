import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAiSettingsPayload, validateAppearance, validateBrandAsset } from './form.ts';

test('never sends a blank AI key and keeps step-up password write-only', () => {
  assert.deepEqual(buildAiSettingsPayload('openai', 'gpt-model', '', ''), { model: 'gpt-model', provider: 'openai' });
  const changed = buildAiSettingsPayload('groq', 'model', 'secret-value', 'password');
  assert.equal(changed.apiKey, 'secret-value'); assert.equal(changed.currentPassword, 'password');
});
test('validates safe appearance inputs', () => {
  assert.equal(validateAppearance('#EC2027', '#642024', 'default'), null);
  assert.match(validateAppearance('red', null, 'default') ?? '', /#RRGGBB/);
});
test('validates brand asset MIME and size before upload', () => {
  assert.equal(validateBrandAsset('image/png', 1024), null);
  assert.match(validateBrandAsset('image/svg+xml', 1024) ?? '', /PNG/);
  assert.match(validateBrandAsset('image/png', 6 * 1024 * 1024) ?? '', /5 MB/);
});
