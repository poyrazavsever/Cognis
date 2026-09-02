# Phase 13 - AI chat and project risk

Last updated: 2026-07-26

Phase 13 is implemented for the mobile contracts and owner surface. Server v1
routes, provider configuration navigation and authorization regressions remain pending.

## Implemented on mobile

- Chat session list/create/delete and paginated message history clients.
- Virtualized message/session lists, keyboard-safe multiline composer and auto-scroll.
- Expo SDK 57 standard-stream based NDJSON response consumption.
- Incremental assistant announcements, stop generation, 45-second timeout and retry.
- Separate upstream timeout, provider unavailable and generic provider error UX.
- Project ID based risk analysis action with accessible textual result.
- Secure per-instance auth cookie forwarding for ordinary and streaming resources.
- Error redaction that prevents likely API keys, tokens and authorization values from
  reaching the user-facing error surface.

The exact transport is documented in [native-streaming-protocol.md](native-streaming-protocol.md).

## Server work still required

- Implement and authorize chat session/message and project-risk endpoints.
- Emit the documented terminal event exactly once and support request abort.
- Persist idempotency replays without duplicating user or assistant messages.
- Add cross-owner, timeout, disconnect and provider-secret leakage regressions.
- Phase 15 must add the direct owner AI-settings navigation target.

No provider key, model secret or raw upstream error is logged or rendered by mobile.
