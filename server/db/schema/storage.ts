import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type {
  BrandingColorMode,
  BrandingRadiusScale,
  FileKind,
  FileVisibility,
} from "../../domain/types";
import { user } from "./auth";
import { projects } from "./domain";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    authUserId: text("auth_user_id").references(() => user.id, { onDelete: "restrict" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "restrict" }),
    kind: text("kind").$type<FileKind>().notNull(),
    visibility: text("visibility").$type<FileVisibility>().default("private").notNull(),
    storagePath: text("storage_path").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: text("sha256").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("files_storage_path_unique").on(table.storagePath),
    index("files_owner_kind_idx").on(table.ownerUserId, table.kind),
    index("files_auth_user_id_idx").on(table.authUserId),
    index("files_project_id_idx").on(table.projectId),
    index("files_sha256_idx").on(table.sha256),
    check(
      "files_kind_check",
      sql`${table.kind} in ('avatar', 'branding_logo', 'branding_icon', 'project_asset')`,
    ),
    check(
      "files_visibility_check",
      sql`${table.visibility} in ('private', 'portal', 'public_branding')`,
    ),
    check("files_byte_size_check", sql`${table.byteSize} > 0`),
    check("files_sha256_check", sql`length(${table.sha256}) = 64`),
    check("files_storage_path_check", sql`${table.storagePath} not like '/%' and instr(${table.storagePath}, '..') = 0`),
    check(
      "files_resource_check",
      sql`(
        (${table.kind} = 'avatar' and ${table.authUserId} is not null and ${table.projectId} is null and ${table.visibility} = 'private')
        or (${table.kind} in ('branding_logo', 'branding_icon') and ${table.authUserId} is null and ${table.projectId} is null and ${table.visibility} = 'public_branding')
        or (${table.kind} = 'project_asset' and ${table.authUserId} is null and ${table.projectId} is not null and ${table.visibility} in ('private', 'portal'))
      )`,
    ),
  ],
);

export const instanceBranding = sqliteTable(
  "instance_branding",
  {
    id: text("id").primaryKey().default("default"),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    applicationName: text("application_name").default("Neta").notNull(),
    shortName: text("short_name").default("Neta").notNull(),
    primaryColor: text("primary_color").default("#C81E1E").notNull(),
    accentColor: text("accent_color").default("#E6EDF5").notNull(),
    lightLogoFileId: text("light_logo_file_id").references(() => files.id, { onDelete: "set null" }),
    darkLogoFileId: text("dark_logo_file_id").references(() => files.id, { onDelete: "set null" }),
    iconFileId: text("icon_file_id").references(() => files.id, { onDelete: "set null" }),
    defaultColorMode: text("default_color_mode").$type<BrandingColorMode>().default("system").notNull(),
    radiusScale: text("radius_scale").$type<BrandingRadiusScale>().default("default").notNull(),
    organizationName: text("organization_name"),
    supportEmail: text("support_email"),
    portalWelcomeText: text("portal_welcome_text"),
    portalFooterText: text("portal_footer_text"),
    updatedByUserId: text("updated_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("instance_branding_owner_unique").on(table.ownerUserId),
    check("instance_branding_id_check", sql`${table.id} = 'default'`),
    check("instance_branding_primary_color_check", sql`${table.primaryColor} glob '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'`),
    check("instance_branding_accent_color_check", sql`${table.accentColor} glob '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'`),
    check("instance_branding_color_mode_check", sql`${table.defaultColorMode} in ('light', 'dark', 'system')`),
    check("instance_branding_radius_scale_check", sql`${table.radiusScale} in ('compact', 'default', 'soft')`),
  ],
);
