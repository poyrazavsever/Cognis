---
title: Release Checklist
description: Lists the technical and product checks required before taking Neta to production.
order: 8
---

# Release Checklist

This list covers the main checks that should be completed before publishing Neta in production.

## Environment

Production environment values should be ready:

```env
NODE_ENV=production
DATA_DIR=/app/data
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
BETTER_AUTH_SECRET=strong-secret
TRUSTED_ORIGINS=https://neta.example.com
```

Checklist:

- `APP_URL` matches the real domain.
- `NEXT_PUBLIC_SITE_URL` matches the real domain.
- `BETTER_AUTH_URL` matches the real domain.
- `TRUSTED_ORIGINS` includes the real domain.
- `BETTER_AUTH_SECRET` is strong and unique.
- Supabase environment variables are not used.

## Domain And HTTPS

Domain settings:

- DNS record points to the server IP.
- HTTPS is active.
- Reverse proxy forwards to internal port `3000`.
- Redirect from HTTP to HTTPS works.

## Docker

Docker settings:

- Build Type is Dockerfile.
- Internal port is `3000`.
- Persistent volume is `/app/data`.
- Replica count is `1`.
- Container restart policy is active.

## Data Volume

Persistent data checks:

- `/app/data` is attached to a persistent volume.
- Data survives container restart.
- Uploaded logo and favicon are not deleted.
- Database file is created inside the volume.

## Health

Endpoints to check after deploy:

```text
/api/health/live
/api/health/ready
/api/health
```

Expected status:

- Application is running.
- Database is reachable.
- Migrations are applied.
- Data directory is writable.

## First Owner

First setup checks:

- `/register` opens.
- First owner account can be created.
- Public registration closes after the first owner.
- Login works.
- Logout works.

## Brand Settings

Check in the settings screen:

- Workspace name is entered.
- Meta title is entered.
- Short application name is entered.
- Light logo is uploaded.
- Dark logo is uploaded.
- Favicon is uploaded.
- Primary color is selected.
- Light mode is checked.
- Dark mode is checked.

## Core Product Flows

Production smoke test:

- Create client
- View client detail
- Create portal invite
- Create project
- Create task
- Create calendar event
- Create finance record
- Create journal record
- Test provider if AI will be configured

## Client Portal

Portal checks:

- Client invite link opens.
- Client can set a password.
- Client can log in.
- Client only sees their own data.
- There is no access to another client's data.

## Backup

Backup strategy:

- Manual backup command is tested.
- Backup file is created.
- Restore rehearsal is completed.
- Backup is copied outside the host.
- Retention policy is defined.

## Upgrade

Before a new version:

- Backup is taken.
- Restore rehearsal is completed.
- New image is built.
- Migrations succeed.
- Health endpoints succeed.
- Critical flows are tested.

## Supabase Check

The current self-hosted version should not have a Supabase runtime dependency.

Check:

- No Supabase package.
- No Supabase env.
- No Supabase client.
- No Supabase runtime import.
- No Supabase schema or migration used for runtime.

## Final Decision

To consider the release ready:

- Health endpoints must pass.
- First owner must be created.
- Data volume must be persistent.
- Domain and HTTPS must work correctly.
- Backup strategy must be ready.
- Core owner and client flows must be tested.

When these checks are complete, Neta is ready to be used in production.
