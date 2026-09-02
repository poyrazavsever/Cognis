# Phase 14 - Business modules

> Superseded: Redesign Faz 0 ile ticari kayıtlar mobil kapsamdan, contract'tan
> ve production bundle'dan kaldırıldı. Aşağıdaki metin tarihsel kayıttır.

Last updated: 2026-07-26

Phase 14 is implemented for the mobile contracts and owner surface. Server CRUD,
domain acceptance and owner-scope regressions remain pending.

## Implemented on mobile

- Shared list/detail/create/update/delete clients for proposals, contracts, invoices
  and subscriptions under `/api/v1/business/*`.
- Virtualized, searchable resource views with accessible type/status selectors.
- Proposal amount/status/validity and client/project fields.
- Contract content/status/signed-date fields.
- Invoice number, amount, tax amount, dates and payment status fields.
- Subscription billing cycle, next billing date and status fields.
- Localized title/content/description payloads, ISO currency and integer minor-unit
  conversion, version forwarding and create idempotency.
- Offline mutation guard, destructive confirmation, keyboard avoidance, 48 dp targets
  and first-invalid-field focus.

## Product and server work still required

- Implement and authorize each business CRUD endpoint with cursor pagination.
- Confirm web/domain status transitions and required fields per resource.
- Add owner-scope, conflict, money, date and idempotency server regressions.
- Advertise future PDF generation/sharing as an explicit capability before mobile
  exposes it.

The mobile app intentionally does not render PDF/share promises unsupported by the
current backend.
