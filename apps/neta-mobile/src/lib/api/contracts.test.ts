import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createIdempotencyKey,
  isApiEnvelope,
  isCalendarRangeResponse,
  isAiSettings,
  isAppearanceSettings,
  isChatMessage,
  isChatSession,
  isClientListItem,
  isClientActivityMutationPayload,
  isFinanceSummary,
  isFinanceTransactionListItem,
  isFileAsset,
  isJournalRangeResponse,
  isLocaleDefinition,
  isProjectRiskAnalysis,
  isOwnerDashboard,
  isOwnerDashboardOverview,
  isPaginatedResponse,
  isPortalAsset,
  isPortalDashboard,
  isPortalProjectDetail,
  isPortalTask,
  isProjectListItem,
  isProjectAsset,
  isProjectRevision,
  isTaskListItem,
} from '@neta/api-contracts';

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function isNever(_value: unknown): _value is never {
  return false;
}

function isUnknown(_value: unknown): _value is unknown {
  return true;
}

test('validates API envelopes', () => {
  assert.equal(isApiEnvelope({ ok: true, data: { value: 1 } }, isObject), true);
  assert.equal(
    isApiEnvelope({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Nope' } }, isNever),
    true,
  );
  assert.equal(isApiEnvelope({ ok: true }, isUnknown), false);
});

test('validates task and bounded calendar contracts', () => {
  assert.equal(
    isTaskListItem({
      actualMinutes: null,
      clientId: 'client-a',
      clientName: 'Acme',
      dueAt: '2026-08-01T12:00:00.000Z',
      estimatedMinutes: 60,
      id: 'task-a',
      isPublicToClient: true,
      priority: 'high',
      projectId: 'project-a',
      projectName: 'Neta Mobile',
      scheduledDate: null,
      status: 'in_progress',
      title: 'Calendar UI',
      updatedAt: '2026-07-26T10:00:00.000Z',
    }),
    true,
  );
  assert.equal(
    isCalendarRangeResponse({
      from: '2026-07-27',
      items: [
        {
          clientId: null,
          endAt: '2026-08-01T11:00:00.000Z',
          id: 'event-a',
          projectId: 'project-a',
          readOnly: true,
          source: 'task',
          startAt: '2026-08-01T10:00:00.000Z',
          taskId: 'task-a',
          title: 'Deadline',
          type: 'deadline',
        },
      ],
      timezone: 'Europe/Istanbul',
      to: '2026-09-07',
    }),
    true,
  );
});

test('validates pagination contract', () => {
  assert.equal(
    isPaginatedResponse(
      {
        items: [{ id: 'one' }],
        pageInfo: { hasNextPage: false, nextCursor: null },
      },
      (item) => typeof item === 'object' && item !== null && 'id' in item,
    ),
    true,
  );
});

test('validates dashboard contract', () => {
  assert.equal(
    isOwnerDashboard({
      generatedAt: '2026-07-25T12:00:00.000Z',
      range: 'this_month',
      recentClients: [],
      recentProjects: [],
      stats: [{ id: 'net', label: 'Net', trendLabel: null, value: { amountMinor: 120000, currency: 'TRY' } }],
    }),
    true,
  );
});

test('validates a range-consistent aggregate dashboard contract', () => {
  const dashboard = { generatedAt: '2026-07-25T12:00:00.000Z', range: 'this_month', recentClients: [], recentProjects: [], stats: [] };
  const analytics = { chartSummary: 'Bu ay gelir yükseldi.', generatedAt: '2026-07-25T12:00:00.000Z', projects: [], range: 'this_month', revenue: [], tasks: [] };
  assert.equal(isOwnerDashboardOverview({ analytics, dashboard }), true);
  assert.equal(isOwnerDashboardOverview({ analytics: { ...analytics, range: 'today' }, dashboard }), false);
});

test('creates namespaced idempotency keys', () => {
  assert.match(createIdempotencyKey('task'), /^task-[a-z0-9]+-[a-z0-9]+$/);
});

test('validates client and project list contracts', () => {
  assert.equal(
    isClientListItem({
      displayName: 'Acme',
      email: null,
      id: 'client-a',
      phone: null,
      portalLocale: 'tr',
      portalStatus: 'invited',
      projectCount: 2,
      pipelineStatus: 'lead',
      status: 'active',
      updatedAt: '2026-07-26T10:00:00.000Z',
    }),
    true,
  );
  assert.equal(
    isProjectListItem({
      clientId: 'client-a',
      clientName: 'Acme',
      dueDate: null,
      id: 'project-a',
      progress: 72,
      progressType: 'manual',
      status: 'active',
      title: 'Neta Mobile',
      type: 'client_project',
      updatedAt: '2026-07-26T10:00:00.000Z',
    }),
    true,
  );
});

test('validates phase six client activity mutations', () => {
  assert.equal(isClientActivityMutationPayload({ note: 'Teklif görüşüldü.', occurredAt: '2026-07-29T09:00:00.000Z', type: 'call' }), true);
  assert.equal(isClientActivityMutationPayload({ note: '   ', type: 'note' }), false);
  assert.equal(isClientActivityMutationPayload({ note: 'Not', type: 'internal' }), false);
});

test('validates owner project revision and asset boundaries', () => {
  assert.equal(isProjectRevision({ createdAt: '2026-07-29T09:00:00.000Z', description: 'Logo büyütülsün.', id: 'revision-a', requestedBy: 'client-a', status: 'pending' }), true);
  assert.equal(isProjectRevision({ createdAt: '2026-07-29T09:00:00.000Z', description: 'Logo', id: 'revision-a', requestedBy: null, status: 'unknown' }), false);
  assert.equal(isProjectAsset({ createdAt: '2026-07-29T09:00:00.000Z', id: 'asset-a', mimeType: 'application/pdf', name: 'brief.pdf', sizeBytes: 2048, url: 'https://neta.test/files/brief.pdf', visibility: 'private' }), true);
  assert.equal(isProjectAsset({ createdAt: '2026-07-29T09:00:00.000Z', id: 'asset-a', mimeType: 'application/pdf', name: 'brief.pdf', sizeBytes: 2048, url: 'https://neta.test/files/brief.pdf', visibility: 'public' }), false);
});

test('validates finance minor-unit and journal privacy-safe list contracts', () => {
  assert.equal(isFinanceSummary({ generatedAt: '2026-07-26T10:00:00.000Z', month: '2026-07', taxDisclaimer: null, totals: {
    expense: { amountMinor: 4000, currency: 'TRY' }, gross: { amountMinor: 10000, currency: 'TRY' }, income: { amountMinor: 10000, currency: 'TRY' }, net: { amountMinor: 6000, currency: 'TRY' }, pending: { amountMinor: 0, currency: 'TRY' }, taxEstimate: null,
  } }), true);
  assert.equal(isFinanceTransactionListItem({ amount: { amountMinor: 4000, currency: 'TRY' }, category: 'Araç', clientId: null, clientName: null, date: '2026-07-26', description: null, id: 'finance-a', kind: 'expense', paymentStatus: 'paid', projectId: null, projectName: null, updatedAt: '2026-07-26T10:00:00.000Z' }), true);
  assert.equal(isJournalRangeResponse({ from: '2026-07-01', items: [{ date: '2026-07-26', energy: 4, id: 'journal-a', mood: 3, moodLabel: 'İyi', satisfaction: 5, updatedAt: '2026-07-26T10:00:00.000Z' }], to: '2026-08-01' }), true);
});

test('validates chat and risk transport contracts', () => {
  assert.equal(isChatSession({ createdAt: '2026-07-26T10:00:00.000Z', id: 'session-a', lastMessagePreview: null, title: 'Yeni sohbet', updatedAt: '2026-07-26T10:00:00.000Z' }), true);
  assert.equal(isChatMessage({ content: 'Merhaba', createdAt: '2026-07-26T10:00:00.000Z', id: 'message-a', role: 'user', sourceLocale: 'tr' }), true);
  assert.equal(isChatMessage({ content: 'tool result', createdAt: '2026-07-26T10:00:00.000Z', id: 'message-tool', role: 'tool', sourceLocale: null }), true);
  assert.equal(isProjectRiskAnalysis({ generatedAt: '2026-07-26T10:00:00.000Z', projectId: 'project-a', recommendations: ['Takvimi güncelle'], riskLevel: 'medium', summary: 'Takvim riski var.' }), true);
});

test('validates owner settings and locale lifecycle contracts without secrets', () => {
  assert.equal(isAppearanceSettings({ accentColor: '#222222', darkLogoUrl: null, defaultColorMode: 'system', faviconUrl: null, lightLogoUrl: null, primaryColor: '#CC0000', radiusScale: 'default' }), true);
  assert.equal(isAiSettings({ configured: true, maskedKey: '***1234', model: 'model', provider: 'openai' }), true);
  assert.equal(isLocaleDefinition({ code: 'ar', completion: 75, fallbackLocale: 'en', isDefault: false, textDirection: 'rtl', name: 'Arabic', status: 'draft', updatedAt: '2026-07-27T10:00:00.000Z' }), true);
});

test('validates the strict file asset boundary', () => {
  const asset = {
    createdAt: '2026-07-29T10:00:00.000Z',
    id: 'asset-a',
    kind: 'project_asset',
    metadataSanitized: true,
    mimeType: 'image/webp',
    name: 'cover.webp',
    projectId: 'project-a',
    sizeBytes: 2048,
    url: 'https://neta.test/files/cover.webp',
    visibility: 'portal',
  };
  assert.equal(isFileAsset(asset), true);
  assert.equal(isFileAsset({ ...asset, url: '/files/cover.webp' }), false);
  assert.equal(isFileAsset({ ...asset, visibility: 'private-client' }), false);
});

test('validates localized portal dashboard and project detail contracts', () => {
  const project = { description: 'Açıklama', dueDate: null, id: 'project-a', progress: 60, status: 'active', title: 'Mobil uygulama', updatedAt: '2026-07-27T10:00:00.000Z' };
  assert.equal(isPortalDashboard({ fallbackChain: ['tr', 'en'], generatedAt: '2026-07-27T10:00:00.000Z', locale: 'tr', portalFooter: 'Neta', projects: [project], stats: { activeProjects: 1, completedProjects: 0, completedTasks: 4, pendingRevisions: 1 } }), true);
  assert.equal(isPortalProjectDetail({
    assets: [{ id: 'asset-a', mimeType: 'application/pdf', name: 'brief.pdf', sizeBytes: 1200, url: 'https://neta.test/files/brief.pdf', visibility: 'portal' }],
    fallbackChain: ['tr', 'en'],
    locale: 'tr',
    localized: { description: 'Açıklama', title: 'Mobil uygulama' },
    planningSections: [{ description: null, id: 'plan-a', order: 1, title: 'Araştırma' }],
    publicTasks: [{ description: null, dueAt: null, id: 'task-a', isPublicToClient: true, priority: 'high', projectId: 'project-a', projectName: 'Mobil uygulama', status: 'todo', title: 'Onay', updatedAt: '2026-07-27T10:00:00.000Z' }],
    resource: { dueDate: null, id: 'project-a', progress: 60, status: 'active', updatedAt: '2026-07-27T10:00:00.000Z' },
    revisionAllowance: { allowed: 2, canRequest: true, remaining: 1, used: 1 },
    revisions: [{ createdAt: '2026-07-27T10:00:00.000Z', description: 'Başlığı büyütelim.', id: 'revision-a', projectId: 'project-a', projectName: 'Mobil uygulama', sourceLocale: 'tr', status: 'pending', updatedAt: '2026-07-27T10:00:00.000Z' }],
  }), true);
});

test('rejects private portal assets and non-public tasks at the contract boundary', () => {
  assert.equal(isPortalAsset({ id: 'asset-a', mimeType: 'image/png', name: 'private.png', sizeBytes: 42, url: 'https://neta.test/private.png', visibility: 'private' }), false);
  assert.equal(isPortalAsset({ id: 'asset-a', mimeType: 'image/png', name: 'relative.png', sizeBytes: 42, url: '/relative.png', visibility: 'portal' }), false);
  assert.equal(isPortalTask({ description: null, dueAt: null, id: 'task-a', isPublicToClient: false, priority: 'low', projectId: 'project-a', projectName: 'Mobil uygulama', status: 'todo', title: 'İç görev', updatedAt: '2026-07-27T10:00:00.000Z' }), false);
});

test('locks canonical web lifecycle values and rejects legacy mobile drift', () => {
  const dashboard = { generatedAt: '2026-07-29T10:00:00.000Z', recentClients: [], recentProjects: [], stats: [] };
  assert.equal(isOwnerDashboard({ ...dashboard, range: 'this_month' }), true);
  assert.equal(isOwnerDashboard({ ...dashboard, range: 'month' }), false);

  const task = {
    actualMinutes: null, clientId: null, clientName: null, dueAt: null, estimatedMinutes: null,
    id: 'task', isPublicToClient: false, priority: 'medium', projectId: null, projectName: null,
    scheduledDate: null, title: 'Task', updatedAt: '2026-07-29T10:00:00.000Z',
  };
  assert.equal(isTaskListItem({ ...task, status: 'in_progress' }), true);
  assert.equal(isTaskListItem({ ...task, status: 'in-progress' }), false);

  const file = {
    createdAt: '2026-07-29T10:00:00.000Z', id: 'asset', kind: 'branding_logo',
    metadataSanitized: true, mimeType: 'image/png', name: 'logo.png', projectId: null,
    sizeBytes: 100, url: 'https://neta.example/files/logo.png',
  };
  assert.equal(isFileAsset({ ...file, visibility: 'public_branding' }), true);
  assert.equal(isFileAsset({ ...file, visibility: 'public' }), false);
});
