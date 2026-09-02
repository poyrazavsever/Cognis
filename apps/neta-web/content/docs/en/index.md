---
title: What Is Neta?
description: Explains what Neta is, who it is designed for, and which problem it solves.
order: 1
---

# What Is Neta?

Neta is a self-hosted client and work management portal that freelancers can run under their own brand.

A freelancer can manage clients, projects, tasks, finance records, daily notes, calendar items, and client portal communication from one panel. The system does not depend on an external BaaS service. Data is stored in SQLite, authentication is handled with Better Auth, and files are kept in the persistent data area on the server.

Neta's goal is to help a freelancer build a small operations center of their own. Instead of renting another SaaS account, the owner gets a portal that runs on their own server, carries their own logo and colors, and can be opened to clients through their own domain.

## Who Is It For?

Neta is designed especially for:

- Solo freelancers
- Small creative teams
- Software developers
- Designers
- Consultants
- Independent workers moving toward an agency model
- Service providers who want to show project status to clients regularly

Neta is not designed as a large multi-user corporate ERP. The main target is one owner user managing their own clients and workflows.

## What Does Neta Provide?

With Neta, a freelancer can:

- Track clients from one central place.
- Create projects for each client.
- Attach tasks, finance records, calendar events, and notes to projects.
- Open portal accounts for clients.
- Make sure clients only see their own data.
- Track income, expenses, and pending payments.
- Record daily work notes and mood.
- Receive AI-supported analysis.
- Customize the system with their own logo, favicon, and colors.
- Work on their own server, with their own data.

## Why Self-Hosted?

Most freelancer tools run on external services. That is convenient, but it can reduce control:

- It may not be clear where the data is stored.
- Subscription costs can increase over time.
- The brand experience can stay limited.
- The client portal can appear under another product's domain.
- If the service shuts down or changes pricing, dependency becomes a risk.

Because Neta is self-hosted, data stays on the freelancer's own server. Domain, logo, colors, favicon, and application name are controlled by the owner. This is especially useful for freelancers who want their brand to feel more professional.

## Core Operating Model

A Neta instance runs around a single owner account. During the first setup, the owner account is created from `/register`. After the first owner is created, public registration is closed.

Later users are invited for the client portal. When a client signs in with their own account, they can only see the client and project data that belongs to them.

This model keeps Neta simple:

- The owner manages the system.
- Clients only use the portal area opened for them.
- Data is stored in one SQLite database.
- Uploaded files are kept in the same persistent data area.

## Main Sections

Neta includes these core modules:

- Dashboard
- Clients
- Projects
- Tasks
- Calendar
- Finance
- Journal
- Chat and AI
- Client portal
- Settings and customization

These modules work together. For example, the owner creates a client, attaches a project to that client, adds tasks to the project, records income for the work, and shares the relevant status in the client portal.

## Design Approach

Neta is designed as an operational work panel. The interface is meant to support quick scanning, fast action, and clear information rather than decoration.

Main principles:

- Avoid unnecessary complexity.
- Keep cards, tables, and lists readable.
- Maintain a consistent experience in dark and light mode.
- Use one design language through Poyraz UI components.
- Keep the client portal simple and secure.

## Data Ownership

In Neta, the main data stays inside the instance installed by the freelancer. At runtime, Supabase, Firebase, or a similar external BaaS service is not required.

The main production data area is usually:

```text
/app/data/
  neta.db
  uploads/
  backups/
  tmp/
```

This folder is mounted as a persistent volume. That way, the database and uploaded files survive container rebuilds.

## Summary

Neta is a lightweight self-hosted work management system that freelancers can run on their own domain, use to open a client portal, and manage daily operations from one place.

The core value proposition is simple: your brand, your data, your client portal.
