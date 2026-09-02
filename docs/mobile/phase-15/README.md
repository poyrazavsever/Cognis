# Phase 15 - Owner profile, security and instance settings

Last updated: 2026-07-27

Phase 15 is implemented for mobile contracts and owner surfaces. Server routes,
step-up policy and meta invalidation regressions remain pending.

## Implemented on mobile

- Profile display-name update and read-only email policy.
- Password change plus device/session list and destructive revoke confirmation.
- General workspace/company/footer settings.
- Appearance colors, default mode, radius and immediate runtime branding update.
- Light/dark logo and favicon upload/remove with system document picker, MIME allowlist
  and 5 MB size guard.
- AI provider/model/key form. Existing secrets are represented only by configured and
  masked state; blank key preserves the server secret and new keys are never re-read.
- Optional current-password step-up field and global secret-bearing error redaction.
- Keyboard-safe forms, first-invalid focus, 48 dp controls and offline mutation guard.

## Server work still required

- Implement and authorize `/api/v1/me/*` and `/api/v1/settings/*` endpoints.
- Decide session-list support for the selected auth model.
- Enforce step-up authentication for secret/lifecycle operations.
- Invalidate meta/discovery caches after branding, workspace and locale changes.
- Add disabled-user, revoke, cross-role, MIME and secret-leakage regressions.

Three SDK-pinned native modules are used for both phases: document picker, file system
and system sharing. No gallery/media permission dependency is added.
