# Phase 7 - Clients vertical slice

Last updated: 2026-07-26

Phase 7 is implemented for the mobile client surface and contract layer. Server
API implementation and authorization regression tests remain pending.

## Implemented on mobile

- Client list API client for `GET /api/v1/clients`.
- Client detail API client for `GET /api/v1/clients/:id`.
- Client activity API client for `GET /api/v1/clients/:id/activities`.
- Client create/update/archive helpers with idempotency key support for create.
- Portal invitation helper for
  `POST /api/v1/clients/:id/portal-invitations`.
- Client list screen with search, status filters, loading, empty, error and
  retry states.
- Localized client form payload builder.
- Contract tests for client list and mutation payload shapes.
- Debounced search, stale response protection and 48 dp filter targets.
- Keyboard-safe form scrolling, programmatic labels, inline error association,
  live error summary and first-invalid-field focus.

## Server work still required

- Implement clients CRUD/list/detail/archive endpoints.
- Implement client activities and portal invitation endpoints.
- Add owner-only, duplicate invitation, conflict/version and cross-owner tests.
- Finalize portal locale update behavior in the backend contract.

The mobile screen does not use mock data. Missing or incompatible endpoints are
shown as retryable API errors.
