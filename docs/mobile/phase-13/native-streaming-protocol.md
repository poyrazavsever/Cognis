# Native AI streaming protocol v1

The mobile client posts to:

```http
POST /api/v1/chat/sessions/:id/messages
Accept: application/x-ndjson
Content-Type: application/json
Idempotency-Key: chat-message-...
```

Request body:

```json
{"content":"...","sourceLocale":"tr"}
```

The response is UTF-8 NDJSON. A JSON object occupies one line; chunk boundaries may
occur anywhere inside a multibyte character or JSON line. Supported events are:

```json
{"type":"message.delta","delta":"Merhaba"}
{"type":"message.completed","message":{"id":"...","role":"assistant","content":"Merhaba","sourceLocale":null,"createdAt":"2026-07-26T12:00:00.000Z"}}
{"type":"error","code":"UPSTREAM_TIMEOUT","message":"safe public message"}
```

Rules:

- A successful stream ends with exactly one `message.completed` event.
- `message.delta` is display-only; persisted truth is the completed message/history.
- Error codes are limited to `UPSTREAM_ERROR`, `UPSTREAM_TIMEOUT` and
  `SERVICE_UNAVAILABLE`. Mobile ignores their raw message and uses local safe copy.
- API keys, provider payloads, model secrets and authorization headers are forbidden.
- Client abort cancels generation. A retry reuses the same semantic user input; the
  server must honor idempotency and must not duplicate persisted messages.
- HTTP 408/504 map to timeout; 424/503 map to provider unavailable.
- Content type and event schema are independent from web AI SDK hooks.

Expo SDK 57 provides native standard `ReadableStream` and `TextDecoder`; no streaming
dependency is added.
