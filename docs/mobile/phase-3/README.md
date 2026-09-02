# Phase 3 - Domain discovery and instance bootstrap

Last updated: 2026-07-25

Phase 3 is implemented on the mobile client.

## Implemented

- `normalizeNetaOrigin` accepts bare domains and full origins, rejects paths,
  query strings, fragments, credentials and unsafe protocols.
- Production builds reject remote HTTP origins.
- Development builds allow local HTTP origins such as `localhost`, `127.0.0.1`
  and Android emulator `10.0.2.2`.
- Discovery loads `/.well-known/neta`, validates `protocol: "neta"`,
  `discoveryVersion`, `instanceId`, trusted same-origin API URLs, health, meta,
  minimum client version and mobile capability.
- Public localization catalog is fetched and cached when available.
- Instance metadata is saved in AsyncStorage without secrets.
- If the same origin returns a different `instanceId`, prior session material is
  cleared instead of being migrated.
- Instance branding feeds the mobile theme via semantic primary/accent tokens.
- The connection screen now exposes domain, checking, error, incompatible and
  ready-for-auth states.

## Security notes

Redirect handling allows up to three redirects and rejects HTTPS to HTTP
downgrades. TLS certificate failures are not bypassed; React Native fetch
surfaces them as connection failures.

## Validation

- `pnpm --filter @neta/mobile check` passes.
- Unit tests cover domain normalization, local HTTP policy and semver comparison.
- Android/iOS Metro exports should be rerun after discovery contract changes.
