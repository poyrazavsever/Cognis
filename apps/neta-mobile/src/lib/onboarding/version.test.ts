import assert from 'node:assert/strict';
import test from 'node:test';

import { hasCompletedOnboarding, ONBOARDING_VERSION } from './version.ts';

test('onboarding completion is versioned and invalid values are rejected', () => {
  assert.equal(hasCompletedOnboarding(null), false);
  assert.equal(hasCompletedOnboarding('invalid'), false);
  assert.equal(hasCompletedOnboarding(String(ONBOARDING_VERSION - 1)), false);
  assert.equal(hasCompletedOnboarding(String(ONBOARDING_VERSION)), true);
});
