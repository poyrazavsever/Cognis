# Phase 11 - Finance vertical slice

Last updated: 2026-07-26

Phase 11 is implemented for the mobile contract and owner surface. Server API,
authorization and redaction regressions remain pending.

## Implemented on mobile

- Summary, transaction CRUD and AI analysis client contracts.
- Monthly stat carousel, debounced search and transaction kind filtering.
- Create/edit/delete flow with destructive confirmation and version forwarding.
- Localized category/description payloads and ISO 4217 currency validation.
- Integer minor-unit parsing via `BigInt`; locale separators and non-two-decimal
  currencies are covered without mutation-time floating point arithmetic.
- Idempotency keys on transaction creation and AI analysis requests.
- Keyboard-safe screen, first invalid field focus, radio semantics and 48 dp targets.

## Server work still required

- Implement and authorize `/api/v1/finance/summary`, transaction CRUD and
  `/api/v1/finance/analysis`.
- Define duplicate replay storage/expiry and prove idempotency under retries.
- Return provider-missing, timeout and conflict errors using the v1 error envelope.
- Add owner-scope, tax-policy and sensitive log-redaction tests.

No mock data or hard-coded VAT rate is used. Missing endpoints remain visible as
retryable API errors.
