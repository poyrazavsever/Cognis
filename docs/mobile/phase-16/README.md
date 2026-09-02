# Phase 16 - Localization and multilingual forms

Last updated: 2026-07-27

Phase 16 is implemented for the mobile runtime and owner management surface. Server
locale APIs and device-level RTL E2E remain pending.

## Implemented on mobile

- Key-parity checked bundled Turkish/English `mobile-*` fallback catalog.
- Remote catalog resolution keyed by instance, locale and catalog version; state is
  replaced only after a complete valid response.
- Personal language selection from instance-enabled locales.
- Locale list, draft creation, metadata, fallback, RTL and guarded lifecycle controls.
- Virtualized namespace/filter/key translation editor.
- Validated JSON import through the system document picker.
- Asynchronous cache-file export through the native share sheet.
- Shared localized payload registry used by client, project, task, calendar, finance
  and journal forms, including missing-active-locale detection.
- RTL direction detection and explicit restart-required UX.
- Production UI raw-key scan wired into the mobile quality gate.

## Remaining work

- Implement and authorize all `/api/v1/settings/locales*` endpoints.
- Register every mobile namespace in the server translation registry.
- Complete phone/tablet custom-locale and RTL restart E2E.
- Expand each entity editor from the shared payload registry to simultaneous
  active-locale tabs; current create screens still author one source locale per submit.
- Add server `UNSUPPORTED_LOCALE` refresh/conflict and lifecycle regressions.

No raw translation key is rendered when remote catalog loading fails; bundled TR/EN
copy remains available.
