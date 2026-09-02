import assert from 'node:assert/strict';
import test from 'node:test';

import { ownerDashboardOverviewPath } from './policy.ts';

test('uses one aggregate owner dashboard endpoint', () => {
  assert.equal(ownerDashboardOverviewPath('this_month'), 'dashboard/overview?range=this_month');
});
