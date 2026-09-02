---
title: Customization
description: Explains how brand, logo, favicon, theme, and appearance settings are managed in Neta.
order: 4
---

# Customization

Neta is designed so the person self-hosting it can carry their own brand. The user controls not only their data, but also the application's appearance and the main brand information shown in the client portal.

## Customizable Fields

These fields can be customized in Neta:

- Workspace name
- Company or freelancer name
- Meta title
- Short application name
- Light theme logo
- Dark theme logo
- Favicon
- Primary color
- Theme mode

These settings are stored centrally in the system and used across different parts of the interface.

## Workspace Name

The workspace name represents the business area where the application is installed.

This value can be used in areas such as the dashboard, settings, and mobile meta endpoints. The freelancer can use their own name, company name, or the brand name they want clients to see.

Examples:

```text
Poyraz Studio
Neta Works
Freelance OS
Avsever Digital
```

## Meta Title

The meta title is the title information used in the browser tab and search previews.

Example:

```text
Poyraz Studio Portal
```

This is especially important for the client portal experience. When a client opens the link, the browser should show the freelancer's brand instead of a generic or unrelated title.

## Short Application Name

The short application name can be used for mobile clients, manifest-like areas, and compact displays.

Examples:

```text
Poyraz
Neta
Studio
```

## Light And Dark Logo

Neta supports separate logos for light and dark themes.

This matters because a single logo may not look good on both themes. A dark logo used on a light background can disappear on a dark background. Likewise, a logo prepared for dark mode may look wrong in light mode.

Recommended structure:

- Light theme logo: a logo that works well on light backgrounds
- Dark theme logo: a logo that works well on dark backgrounds

Only the logo image is shown in the sidebar. Extra text or explanation is not added.

## Favicon

The favicon is the small icon shown in the browser tab.

When the favicon setting is configured in Neta, the application's root layout can use that information. This lets the self-hosted instance carry its own small brand mark.

Recommended formats:

- `.ico`
- `.png`
- Square-ratio image

## Primary Color

The primary color defines the application's accent color.

This color can be used on buttons, selected states, active menus, and some interface highlights. The goal is not to paint the whole application with one color, but to create a recognizable brand accent.

Recommendations for choosing a good primary color:

- Avoid colors with very low contrast.
- Check readability in both dark and light mode.
- If the brand color is very bright, make sure it does not tire the eye in the interface.
- Be careful when using colors such as red as the primary color, because they can carry warning meaning.

## Theme Mode

Neta can support three theme preferences:

- Light
- Dark
- System

The System option follows the user's operating system or browser preference.

## Storing Settings

Branding and appearance settings are stored in SQLite.

Files such as logos and favicons are saved in the local upload area. In production, this area should be on the persistent volume under `/app/data`.

Typical data structure:

```text
/app/data/
  uploads/
  neta.db
```

This keeps branding settings and uploaded files safe even when the container is recreated.

## Effect On The Client Portal

Customization is not only for the owner dashboard. The client portal uses the same brand information.

That means clients see a professional experience under the freelancer's own domain and brand.

These details are especially important on the client side:

- Logo
- Favicon
- Meta title
- Primary color
- Theme consistency

## Effect On Mobile

Neta's brand information is structured so it can also be used by mobile clients in the future.

When a mobile app connects to a Neta instance, it can read brand information from public endpoints such as `/api/v1/meta`.

This information can include:

- Workspace name
- Application name
- Logo URLs
- Favicon URL
- Primary color
- Capability information

## Recommended Setup Order

After installing a new Neta instance, the recommended customization order is:

1. Set the workspace name.
2. Enter the meta title.
3. Upload the light logo.
4. Upload the dark logo.
5. Upload the favicon.
6. Choose the primary color.
7. Check the visuals in both light and dark mode.
8. Test the client portal appearance.

## Summary

Neta's customization system helps a self-hosted application look like the freelancer's own product. Logo, favicon, color, theme, and workspace settings are managed centrally and prepared for the dashboard, client portal, and future mobile clients.
