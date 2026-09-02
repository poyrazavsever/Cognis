---
title: Self Host And Deploy
description: Explains how to self-host Neta with Docker, Dokploy, Coolify, or Compose.
order: 6
---

# Self Host And Deploy

Neta is designed to run self-hosted. It does not need an external Supabase project, managed database service, or separate backend application.

Core production requirements:

- A server that supports Docker
- HTTPS reverse proxy
- Persistent volume
- Strong auth secret
- Single replica

## Minimum Environment

Recommended minimum production environment:

```env
NODE_ENV=production
DATA_DIR=/app/data
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
BETTER_AUTH_SECRET=strong-secret
TRUSTED_ORIGINS=https://neta.example.com
```

`BETTER_AUTH_SECRET` must be strong and unique.

Generate a secret:

```bash
openssl rand -base64 32
```

## Persistent Data Area

Neta's production data is stored under `/app/data`.

This folder must be a persistent volume.

```text
/app/data/
  neta.db
  uploads/
  backups/
  tmp/
```

If this area is deleted, the database, uploaded logos, favicons, and backup files can be lost.

## Running With Docker

The repository is ready for production builds with a Dockerfile.

Example with Docker Compose:

```bash
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export APP_URL="https://neta.example.com"
export NEXT_PUBLIC_SITE_URL="$APP_URL"

docker compose up -d --build
```

In Compose, a named volume is mounted for `/app/data`.

## Deploying With Dokploy

The recommended method on Dokploy is Application + Dockerfile deploy.

Basic settings:

```text
Build Type: Dockerfile
Dockerfile Path: Dockerfile
Docker Context Path: .
Internal Port: 3000
Persistent Volume: /app/data
Replicas: 1
```

Environment:

```env
NODE_ENV=production
DATA_DIR=/app/data
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
BETTER_AUTH_SECRET=secret-generated-with-openssl
TRUSTED_ORIGINS=https://neta.example.com
```

For the domain setting, choose `3000` as the container internal port.

Post-deploy checks:

```text
https://neta.example.com/api/health/live
https://neta.example.com/api/health/ready
https://neta.example.com/register
```

If `/api/health/ready` succeeds, database, data directory, and migration checks are healthy.

## Deploying With Coolify

Coolify can also use Dockerfile deploy.

Recommended settings:

```text
Build Pack: Dockerfile
Port: 3000
Volume: /app/data
Replica: 1
```

Environment values are the same as Dokploy.

## Reverse Proxy And HTTPS

In production, Neta must run behind HTTPS.

Domain:

```text
https://neta.example.com
```

Environment values must match the domain exactly:

```env
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
TRUSTED_ORIGINS=https://neta.example.com
```

If the domain changes, these values must also be updated.

## Single Replica Rule

Because Neta uses SQLite, multiple replicas writing to the same database file are not supported.

In production, run:

```text
Replicas: 1
```

If horizontal scaling is needed in the future, a different database strategy should be planned.

## First Setup

After deployment is complete, open:

```text
https://neta.example.com/register
```

Create the first owner account. After the first owner is created, public registration is closed intentionally for security.

## Health Endpoints

Neta provides these health endpoints:

```text
GET /api/health/live
GET /api/health/ready
GET /api/health
```

The `live` endpoint shows whether the process is running.

The `ready` endpoint checks database, migration, and data directory status.

## Backup

Production environments should have regular backups.

Command:

```bash
pnpm db:backup
```

Backup files should not only stay on the same server. Copy them to an external and secure location.

## Restore

Stop the application before restoring.

Command:

```bash
pnpm db:restore -- --from /path/to/neta-backup --force
```

After restore, start the application again and check health endpoints.

## Upgrade

Recommended flow for upgrading:

1. Take a backup.
2. Test restoring that backup.
3. Start deployment with the new image or commit.
4. Confirm startup migrations completed successfully.
5. Check `/api/health/ready`.
6. Test login, client, project, and portal flows.

SQLite schema downgrades are not supported. That is why backup matters before upgrading.

## Migrating From Supabase

The current Neta version does not require Supabase.

If data will be migrated from an older Supabase setup, an offline export bundle can be imported.

General flow:

```bash
pnpm db:import:supabase -- \
  --from /secure/path/neta-export \
  --owner-user-id BETTER_AUTH_OWNER_ID \
  --dry-run
```

After the dry-run report is verified, run the command again without `--dry-run`.

Supabase Auth passwords and sessions are not migrated. Client users should be invited again.

## Pre-Release Checklist

Before going to production, check:

- Domain DNS record is correct.
- HTTPS is active.
- `APP_URL` is correct.
- `NEXT_PUBLIC_SITE_URL` is correct.
- `BETTER_AUTH_URL` is correct.
- `BETTER_AUTH_SECRET` is strong and unique.
- `/app/data` persistent volume is mounted.
- Replica count is 1.
- `/api/health/ready` succeeds.
- First owner account is created.
- Logo, favicon, and theme are configured.
- Backup strategy is defined.
- Login test is done.
- Client creation test is done.
- Project creation test is done.
- Client portal invite is tested.

## Summary

Neta has a simple structure for self-host deployment. It runs with one container, one persistent data volume, and correct environment values. It can be deployed easily on Dokploy, Coolify, or Docker Compose.
