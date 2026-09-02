# Phase 6 - Owner dashboard and analytics

Last updated: 2026-07-25

Phase 6 is implemented on the mobile client surface and remains blocked for
server API implementation/testing.

## Implemented on mobile

- Owner dashboard screen fetches `/api/v1/dashboard?range=...`.
- Analytics summary fetches `/api/v1/analytics?range=...`.
- The screen supports week/month/year ranges.
- Loading, empty, error, retry and content states are present.
- Stat cards render number, money and string values through localized
  formatters.
- Analytics exposes `chartSummary` as visible text and accessibility label
  instead of adding a chart dependency before the endpoint is real.
- The latest dashboard response shows timestamp, cache marker and request
  duration when available.

## Server work still required

- Implement `GET /api/v1/dashboard`.
- Implement `GET /api/v1/analytics`.
- Add owner-scope tests for both endpoints.
- Measure request count and P95 latency on a live/self-hosted instance.

The mobile screen intentionally does not use mock data. If the endpoint is
missing or the contract differs, the user sees a retryable API error state.
