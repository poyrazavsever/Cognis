---
title: Code Structure
description: Explains Neta's frontend, backend, database, auth, and script structure.
order: 5
---

# Code Structure

Neta is a self-hosted web application built on the Next.js App Router. Backend logic runs on the Next.js server side. The database is SQLite, the ORM is Drizzle, and authentication is managed with Better Auth.

## General Architecture

Neta's current architecture does not depend on external BaaS services.

Main parts:

- Next.js App Router
- React server and client components
- Better Auth
- SQLite
- better-sqlite3
- Drizzle ORM
- Local file storage
- Poyraz UI v3
- Docker standalone runtime

## Folder Structure

The general folder structure is:

```text
app/
components/
config/
hooks/
lib/
public/
scripts/
server/
docs/
```

## app/

The `app/` folder contains Next.js App Router pages and route structures.

This folder can include dashboard, auth, portal, and API route structures.

Example usage areas:

- Pages
- Layouts
- Server actions
- API route handlers
- Dashboard client screens
- Portal screens

Route groups can be used to separate different parts of the application.

## components/

The `components/` folder contains shared UI components.

In Neta, the goal is to use Poyraz UI v3 components as much as possible. This keeps the design language in one place and makes dark and light mode behavior more consistent.

Shared components can include:

- Sidebar
- Header
- Form parts
- Modal content
- Empty states
- UI helpers

## server/

The `server/` folder contains the main backend-side application logic.

It can include domain services, database schema, migrations, repository-like data access structures, and server-only helpers.

The goal of this layer is to avoid spreading business logic directly into UI components.

## Database Layer

Neta uses SQLite.

Main technologies:

- `better-sqlite3`
- `drizzle-orm`
- Drizzle migrations

SQLite is chosen to keep the self-host experience lightweight. The user does not need to run a separate PostgreSQL, Supabase, or managed database service.

In production, the database file is usually stored here:

```text
/app/data/neta.db
```

## Migration Structure

Migrations run before the application starts.

In the Docker runtime, the startup command applies migrations and then starts the Next.js standalone server.

General flow:

```text
node scripts/migrate.mjs
node server.js
```

Migrations should be designed to run idempotently. That way, when the container restarts, the same migration checks remain safe.

## Auth Layer

Authentication is handled with Better Auth.

Neta's auth model supports two main user types:

- Owner
- Client portal user

The first owner is created from `/register`. After the first owner is created, public registration is closed.

Client users join the system through an invite flow created by the owner.

## Storage Layer

Files are stored on the local filesystem.

Logos, favicons, uploaded files, and backup outputs are kept under `/app/data`.

Example:

```text
/app/data/
  uploads/
  backups/
  tmp/
```

This area must be mounted as a persistent volume during Docker deployment.

## lib/

The `lib/` folder contains helper functions and shared client/server tools used across the application.

Common examples:

- Formatting helpers
- URL helpers
- Auth client helpers
- Theme and appearance helpers
- General utility functions

## config/

The `config/` folder can contain constants or central settings related to application configuration.

Environment values should be read through central helpers as much as possible instead of being accessed everywhere directly.

## scripts/

The `scripts/` folder contains operational commands.

These scripts are used in development, release, and self-host operations.

Example script types:

- Migration
- Backup
- Restore
- Release boundary checks
- Import smoke tests
- Supabase export bundle import tools
- Standalone package preparation

## Poyraz UI

Neta's interface should use Poyraz UI v3.

The goal is to prevent multiple design systems from mixing inside the application. Poyraz UI should be preferred for base components such as buttons, dropdowns, modals, and inputs.

Especially in dark and light mode, check the correct Poyraz UI variants and effects before writing custom CSS.

## API Structure

Neta includes API endpoints that can be used by the web interface and by future mobile clients.

Example public endpoints:

```text
GET /.well-known/neta
GET /api/v1/meta
GET /api/v1/health
```

Endpoint requiring a session:

```text
GET /api/v1/me
```

This structure is the foundation for mobile clients to recognize a Neta instance.

## Supabase-Free Structure

The current code structure has no Supabase runtime dependency.

The application does not need:

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Edge Functions

Offline import scripts can be kept for moving data from older Supabase setups. These scripts are not part of runtime.

## Build And Runtime

The production build produces Next.js standalone output.

The Docker runtime runs this standalone output. This keeps the production container from being filled with unnecessary development files.

At runtime:

- Migrations run.
- The server starts.
- The `/app/data` volume is used.
- Health endpoints are checked.

## Summary

Neta's code structure is built to run one self-hosted Next.js application cleanly. Frontend, backend, auth, database, and storage are managed in the same repository. This simplifies deployment and lets the freelancer run independently on their own server.
