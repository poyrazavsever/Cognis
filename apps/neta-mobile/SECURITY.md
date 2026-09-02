# Security Policy

**English** · [Türkçe](SECURITY.tr.md)

Please do not disclose a suspected vulnerability in a public issue. Use the
repository owner's private security-reporting channel and include the affected
version, platform, reproduction steps, impact, and a minimal proof of concept.
Do not include real customer data, credentials, tokens, or private content.

Supported fixes target the current `main` branch and the latest store candidate.
Authentication bypasses, cross-tenant access, secret exposure, unsafe deep
links, and unredacted private content are treated as release-blocking issues.

Before reporting, reproduce on the latest dependency lock and run:

```sh
pnpm mobile:release:check
pnpm audit --prod
```

Environment files, signing material, EAS/store credentials, and production test
accounts must never be committed. Rotate any secret immediately if accidental
exposure is suspected.
