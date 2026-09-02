# Customizing a Neta Mobile Fork

**English** · [Türkçe](CUSTOMIZATION.tr.md)

Each Neta Mobile fork represents one self-hosted workspace. Fork identity is a
build-time concern; workspace branding and locale metadata may still come from
the configured server at runtime.

## 1. Create the environment file

```sh
cp apps/neta-mobile/.env.example apps/neta-mobile/.env
```

| Variable | Purpose | Example |
| --- | --- | --- |
| `EXPO_PUBLIC_APP_ENV` | `development`, `preview`, or `production` | `production` |
| `EXPO_PUBLIC_NETA_ORIGIN` | HTTPS origin without a path | `https://neta.example.com` |
| `NETA_APP_NAME` | Store and device display name | `Acme Neta` |
| `NETA_APP_SLUG` | Expo project slug | `acme-neta` |
| `NETA_APP_SCHEME` | Deep-link scheme | `acmeneta` |
| `NETA_IOS_BUNDLE_ID` | Unique iOS identifier | `com.acme.neta` |
| `NETA_ANDROID_PACKAGE` | Unique Android package | `com.acme.neta` |
| `NETA_APP_VERSION` | Public semantic version | `1.0.0` |
| `NETA_IOS_BUILD_NUMBER` | Increasing iOS build number | `1` |
| `NETA_ANDROID_VERSION_CODE` | Increasing Android version code | `1` |

Only public, non-secret configuration belongs in `EXPO_PUBLIC_*` variables.

## 2. Replace visual assets

Replace files under `apps/neta-mobile/assets/logo/` while keeping the referenced file
names, formats, and suitable transparent padding. The primary app icon is
`iconLogo.png`; `app.config.ts` also uses it for the adaptive icon and splash.
Run config and native builds after changing assets.

Runtime primary/accent colors, light/dark logos, and default color mode come
from `/api/v1/meta` when the server provides them. Local semantic tokens remain
the accessible fallback and should not be replaced with raw colors in screens.

## 3. Verify the server

The origin must serve:

- `/.well-known/neta`
- `/api/v1/health`
- `/api/v1/meta`
- `/api/v1/localization/catalog`
- Better Auth native sign-in/sign-out
- The authenticated owner and portal routes used by `apps/neta-mobile/src/features`

Run the public bootstrap smoke test:

```sh
pnpm --filter @neta/mobile instance:smoke
```

Feature acceptance must use real owner and client test accounts and include
cross-tenant negative tests. A successful public smoke test alone does not mean
the feature API is complete.

## 4. Regenerate and validate native projects

```sh
pnpm --filter @neta/mobile ios:pods
pnpm --filter @neta/mobile native:verify
pnpm mobile:release:check
pnpm --filter @neta/mobile native:build:android
pnpm --filter @neta/mobile native:build:ios
```

Changing a scheme, bundle ID, package name, icon, or config plugin requires a
new native binary. Restart Metro with `pnpm mobile:start:clear` after env or
workspace dependency changes.

## 5. Configure EAS and stores

`apps/neta-mobile/eas.json` defines development, preview, and production profiles. For a
new fork, replace the demo origin in the profile or configure the named EAS
environment. Signing credentials, API keys, and store credentials belong in
the platform/EAS secret stores, never in Git.

Before release, update privacy/support URLs, screenshots, descriptions, app
review credentials, and native build numbers. Complete the physical-device
matrix in `docs/mobile/redesign-phase-12/native-a11y-matrix.md` and follow the
[release runbook](../../docs/mobile/redesign-phase-12/fork-release-runbook.md).
