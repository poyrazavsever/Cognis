# Phase 9 - Tasks vertical slice

Last updated: 2026-07-26

Phase 9 is implemented for the mobile contract and owner surface. Server API,
authorization and project auto-progress regressions remain pending.

## Implemented on mobile

- Task list/detail/create/update/delete/complete and status-only API helpers.
- Search and status filters with bounded cursor response contracts.
- Accessible list/kanban presentation and task detail summary.
- Localized task payload builder for schedule, due date, duration, relations and
  portal visibility.
- Optimistic status update, server reconciliation and rollback announcement.
- Mutation invalidation across tasks, dashboard, projects and calendar caches.
- Keyboard-safe form, 48 dp controls, associated field errors and first-error focus.
- Contract and form validation unit tests.

## Server work still required

- Implement and authorize the `/api/v1/tasks` endpoint family.
- Add version/conflict, complete idempotency and owner/cross-owner negative tests.
- Verify project auto-progress after task mutations.
- Verify `isPublicToClient` visibility against portal actors.

No mock data is used. Missing endpoints remain visible as retryable API errors.
