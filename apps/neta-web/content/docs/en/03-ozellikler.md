---
title: Features
description: Core features Neta provides for freelancers.
order: 3
---

# Features

Neta combines client, project, task, finance, journal, AI, and client portal modules so freelancers can manage their work through one self-hosted portal.

## Dashboard

The dashboard is the main control screen.

Here the freelancer can quickly see:

- Net earnings
- Active projects
- Completed tasks
- Average mood or energy indicators
- Recently added projects
- Recently added clients
- Income and expense summary
- Journal trends

The dashboard is designed for daily checks. When the user enters the system, they can quickly read which work is important, what the finance status looks like, and how their overall performance is moving.

## Client Management

Client management is one of Neta's core modules.

The freelancer keeps a central record for every client. Projects, portal access, finance records, and client notes can be tracked through that record.

The client module supports:

- Creating clients
- Listing clients
- Viewing client details
- Attaching projects to clients
- Creating client portal accounts
- Tracking client status

## Client Portal

The client portal is a separate area where the freelancer can give clients limited access.

In the client portal, the user only sees data connected to their own account. They cannot access information that belongs to other clients.

The purpose of the portal is to provide regular and controlled information to clients.

With the client portal:

- Project status can be shared.
- Clients can see their own projects.
- Work progress can stay in one central place.
- Unnecessary email and message traffic can be reduced.

## Project Management

Projects are the main tracking area for client work.

Each project can be connected to a client. Tasks, finance records, calendar events, and detailed notes can be followed through projects.

Project management helps with:

- Tracking ongoing work
- Seeing project status
- Following delivery dates
- Understanding workload by client
- Evaluating project finance

## Task Management

Tasks are used to break work into smaller pieces.

In Neta, tasks can be managed as a list or in a kanban style. This gives the owner both a detailed task list and a visual workflow.

Task fields can include:

- Title
- Description
- Status
- Priority
- Due date
- Related project

## Calendar

The calendar module manages time-based work.

Freelancers can use it to track meetings, delivery dates, client calls, and important events.

The calendar is especially useful during busy periods because it helps prevent schedule conflicts and makes the weekly plan easier to scan.

## Finance

The finance module tracks income and expenses.

The freelancer can see monthly finance status, pending payments, income by client or project, and expense distribution.

The finance module supports:

- Income records
- Expense records
- Pending payment tracking
- Client connections
- Project connections
- Monthly summaries
- Expense tracking by category

This screen helps the freelancer manage cash flow with more control.

## Journal

The journal module is used for work notes and personal work tracking.

The journal is not just a simple note area. The freelancer can record a daily summary, energy level, mood, and completed work.

Over time, these records help the owner understand their work patterns more clearly.

## AI Assistant

Neta includes AI-supported analysis and chat flows.

AI features are optional. If the user does not configure an AI provider, the system continues to work with its core features.

Targeted AI use cases include:

- Project risk analysis
- Finance review
- Workload interpretation
- Chat
- Insight generation

API keys are not kept in environment files for runtime use. The owner enters them through settings, and they are stored securely on the server side.

## Brand And Appearance

Because Neta is self-hosted, the person installing it can adjust the application for their own brand.

Customizable fields:

- Workspace name
- Meta title
- Short application name
- Favicon
- Light logo
- Dark logo
- Primary color
- Theme preference

These settings are stored centrally and used consistently by the dashboard, client portal, and mobile discovery endpoints.

## Mobile Readiness

Neta is prepared so mobile applications can connect in the future.

Public meta and health endpoints allow a mobile client to recognize a Neta instance. Brand data, application name, logo URLs, and basic capability information can be received from these endpoints.

## Backup And Restore

Neta has its own backup and restore tools.

Backup can export the database and upload tree safely. Restore can bring back a previously created backup.

This is especially important for self-hosted systems, because data responsibility belongs to the person running the application.

## Architecture Without Supabase

The current self-hosted version of Neta does not have a Supabase runtime dependency.

The application no longer needs:

- Supabase URL
- Supabase anon key
- Supabase service role key
- Supabase Auth
- Supabase Storage
- Supabase PostgreSQL

The application runs its backend logic on the Next.js server side.

## Summary

Neta's core features are built to simplify daily work management for freelancers. Client, project, task, finance, calendar, journal, AI, and portal flows work together to create a personal but professional operations panel.
