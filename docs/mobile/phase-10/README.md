# Phase 10 - Calendar vertical slice

Last updated: 2026-07-26

Phase 10 is implemented for the mobile contract and owner surface. Server API
and ownership regressions remain pending.

## Implemented on mobile

- Bounded calendar range contract with explicit timezone.
- Calendar event list/detail/create/update/delete API helpers.
- Six-week month selector and chronologically sorted agenda view.
- Selected-day event filtering in the user's configured timezone.
- Native system date and time pickers pinned to the Expo SDK 57 version.
- Localized event form with chronological start/end validation.
- Read-only/source semantics for task and finance-derived events.
- Keyboard-safe form, horizontal small-screen calendar access, 48 dp day targets,
  screen-reader labels and first-error focus.
- Date range, timezone, form payload and validation unit tests.

## Server work still required

- Implement and authorize `/api/v1/calendar/events` range and CRUD endpoints.
- Interpret date-only `from`/`to` boundaries in the supplied IANA timezone.
- Add DST overlap/gap, all-day and start/end server regressions.
- Add project/client/task ownership negative tests.
- Ensure task/finance source events are emitted once and remain read-only.

No mock data is used. Missing endpoints remain visible as retryable API errors.
