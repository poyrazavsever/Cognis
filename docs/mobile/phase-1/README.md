# Phase 1 - Workspace and Expo base app

Last updated: 2026-07-25

Phase 1 is complete for the local mobile workspace.

## Completed

- `mobile/` is an Expo Router TypeScript app in the existing pnpm workspace.
- The root workspace keeps the current web root untouched and includes
  `mobile` plus `packages/*`.
- iOS and Android development-build commands exist at root and package level.
- iOS CocoaPods are project-bundled through `mobile/Gemfile.lock` and
  `mobile/scripts/ios-pods.sh`.
- App config, typed routes, protected route groups and the root error boundary
  are in place.
- Strict TypeScript, lint, unit test and public Expo config checks are wired to
  `pnpm --filter @neta/mobile check`.
- Secret storage and public storage adapters are separated.
- Network and app lifecycle state are exposed through
  `AppEnvironmentProvider`.

## Notes

The shell is intentionally thin. Domain discovery, Better Auth restore and
role-based session hydration start in later phases; Phase 1 only guarantees the
mobile workspace, routing boundary, storage boundary and native build baseline.
