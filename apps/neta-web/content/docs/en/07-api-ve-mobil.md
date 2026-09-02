---
title: API And Mobile Readiness
description: Explains Neta's API approach for mobile clients and public instance discovery.
order: 7
---

# API And Mobile Readiness

Neta is designed not only as a web panel, but also as a self-hosted instance that can connect with mobile clients in the future.

The basic idea on the mobile side is this: the user enters their own Neta instance URL, or later connects to their installation with a generated pairing code.

## Instance Discovery

A mobile client or external client can use public endpoints to recognize a Neta instance.

Core endpoints:

```text
GET /.well-known/neta
GET /api/v1/meta
GET /api/v1/health
```

These endpoints provide basic information about the instance without requiring a session.

## User Information

To get the signed-in user:

```text
GET /api/v1/me
```

This endpoint requires a Better Auth session.

If there is no session, user information is not returned. Tokens, secrets, or sensitive information are not shared in the response.

## Meta Endpoint

`/api/v1/meta` is used to return the application's public brand and capability information.

This endpoint allows a future mobile client to open its first screen with the correct brand information.

Possible response fields:

- Workspace name
- Application name
- Meta title
- Light logo URL
- Dark logo URL
- Favicon URL
- Primary color
- Supported features
- Minimum mobile version

## Health Endpoint

`/api/v1/health` can be used by mobile or external clients to understand whether the instance is reachable.

This endpoint can be treated as a lighter compatibility check rather than a full internal readiness check.

## Mobile Connection Scenario

The planned mobile connection experience can look like this:

1. The user opens the mobile app.
2. The user enters their Neta site URL.
3. The mobile app checks the `/.well-known/neta` endpoint.
4. If the instance is valid, the app reads brand data from `/api/v1/meta`.
5. The user signs in.
6. The session is verified with `/api/v1/me`.
7. The mobile app opens screens according to the user's role.

## Device Pairing

A device code or QR-based connection flow is planned, but it may not be active at runtime yet.

In this approach, the owner creates a pairing code from the web panel, the mobile app connects to the instance with that code, and secure pairing is completed.

Until this feature is activated, connecting with the site URL can be used as a simpler starting model.

## Security Principles

The mobile and API side should preserve these principles:

- Public endpoints must not return secrets.
- API keys must not be sent to the browser or mobile client.
- Users should only see data appropriate for their role.
- A client user must not access another client's data.
- Owner-only settings must be protected on the server side.
- Instance URL validation should happen over HTTPS.

## Client Portal And Mobile

The isolation logic in the client portal should also apply to mobile.

If a client user connects from the mobile app, they should only see their own:

- Projects
- Tasks
- Shared information
- Portal communication

## Summary

Neta's API and mobile readiness creates the foundation for self-hosted instances to be used by clients beyond the web interface. Public discovery endpoints, brand information, and session-based user endpoints are the starting points of this structure.
