# Contributing to Neta Mobile

**English** · [Türkçe](CONTRIBUTING.tr.md)

Thank you for improving Neta Mobile. Keep changes focused, accessible, secure,
and compatible with the exact Expo SDK version used by the repository.

## Development workflow

1. Create a focused branch from `main`.
2. Install with `pnpm install --frozen-lockfile`.
3. Copy `apps/neta-mobile/.env.example` to `apps/neta-mobile/.env` and use a
   non-production test instance when changing mutations.
4. Make the smallest coherent change. Do not add a dependency when a React
   Native or Expo primitive already covers the requirement.
5. Add or update contract and behavior tests.
6. Run `pnpm mobile:release:check` before opening a pull request.

Use Conventional Commit-style subjects such as `feat(owner): ...`,
`fix(auth): ...`, `docs: ...`, or `test(portal): ...`.

## Required checks

```sh
pnpm mobile:release:check
pnpm --filter @neta/mobile doctor
pnpm audit --prod
```

Changes to native dependencies or config plugins also require:

```sh
pnpm --filter @neta/mobile ios:pods
pnpm --filter @neta/mobile native:verify
pnpm --filter @neta/mobile native:build:android
pnpm --filter @neta/mobile native:build:ios
```

## Accessibility definition of done

- Every control has a correct role, label, state, and at least a 44×44 pt target.
- Screen-reader focus returns to the trigger after a modal closes.
- Dynamic type does not hide content or actions.
- The last form field remains visible above the keyboard.
- Light/dark contrast, reduced motion, error announcements, and logical focus
  order are verified.
- Long collections use bounded or virtualized rendering.

## API and security rules

- Treat `packages/api-contracts` as the runtime trust boundary.
- Never derive owner/client scope from caller-provided identifiers.
- Add negative authorization tests for portal and cross-tenant changes.
- Never commit credentials, `.env` files, cookies, tokens, customer data, or
  private journal/chat content.
- Do not add mock success responses to production paths when a server route is
  missing.
- Keep API errors redacted and user-safe.

## Pull requests

Describe the outcome, affected routes, validation performed, screenshots for
visual changes, accessibility impact, and any remaining backend or store
blocker. Keep generated native changes intentional and reviewable.

Security issues must follow [SECURITY.md](SECURITY.md), not a public issue.
