import assert from 'node:assert/strict';
import test from 'node:test';

import { detailHref, formHref } from './route-href.ts';

test('encodes entity and modal route parameters', () => {
  assert.equal(detailHref('clients', 'client/a'), '/clients/client%2Fa');
  assert.equal(formHref('task', { clientId: null, projectId: 'p 1' }), '/task?projectId=p+1');
});
