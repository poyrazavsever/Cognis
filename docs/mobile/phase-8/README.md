# Phase 8 - Projects vertical slice

Last updated: 2026-07-26

Phase 8 is implemented for the mobile client surface and contract layer. Server
API implementation and authorization regression tests remain pending.

## Implemented on mobile

- Project list API client for `GET /api/v1/projects`.
- Project detail API client for `GET /api/v1/projects/:id`.
- Planning sections API client for
  `GET /api/v1/projects/:id/planning-sections`.
- Project create/update/complete helpers with idempotency key support for create.
- Project list screen with search, status filters, loading, empty, error and
  retry states.
- Localized project form payload builder.
- Project detail summary surface with progress and revision quota.
- Contract tests for project list and mutation payload shapes.
- Debounced search, stale response protection and 48 dp filter targets.
- Keyboard-safe form scrolling, programmatic labels, inline error association,
  live error summary and first-invalid-field focus.

## Server work still required

- Implement projects CRUD/list/detail endpoints.
- Implement planning section and owner revision endpoints.
- Add progress, revision quota, complete/delete, client-project relation and
  cross-owner negative tests.
- Replace summary-only project detail with full tabs once backend detail payloads
  are final.

The mobile screen does not use mock data. Missing or incompatible endpoints are
shown as retryable API errors.
