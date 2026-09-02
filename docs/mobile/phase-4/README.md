# Phase 4 - Native auth, session and role shell

Last updated: 2026-07-25

Phase 4 is implemented for the mobile client boundary and remains partially
blocked on server/reverse-proxy validation.

## Implemented on mobile

- `createNativeAuthClient(instance)` binds auth requests to the active instance.
- Login calls `POST /api/auth/sign-in/email`.
- Logout calls `POST /api/auth/sign-out` and clears local auth material even if
  the server request fails.
- `/api/v1/me` is used for session restore, foreground stale checks and
  owner/client route decisions.
- SecureStore keys are still namespaced by `instanceId`.
- Disabled users are treated as unauthenticated and local session material is
  cleared.
- Owner and portal route groups remain protected by role.
- Owner and portal shells now show current user/workspace context and expose
  logout.

## Server work still required

- Add and verify the Better Auth Expo server plugin in the web/backend app.
- Add production `neta://` trusted origin and development `exp://`/dev-client
  origins without weakening web CORS.
- Prove native cookie persistence and restore on a real iOS and Android device.
- Test multi-domain cookie isolation with two live Neta instances.
- Run disabled user, password change, revoke, rate-limit and auth audit
  regressions on the server.

The mobile client is deliberately dependency-light here. It uses the existing
Better Auth endpoint contract and SecureStore isolation while the official
Better Auth Expo secure-cookie spike remains a Phase 0/4 quality gate.
