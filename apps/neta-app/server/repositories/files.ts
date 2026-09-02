import { and, desc, eq, or } from "drizzle-orm";
import { instanceBranding } from "../db/schema/storage";
import { files } from "../db/schema/storage";
import type { OwnerScope } from "../domain/actor";
import type { DomainDatabase } from "../domain/database";

export function createFileRepository(db: DomainDatabase) {
  return {
    get: (id: string) => db.select().from(files).where(eq(files.id, id)).get(),
    getOwned: (scope: OwnerScope, id: string) =>
      db.select().from(files).where(and(eq(files.id, id), eq(files.ownerUserId, scope.ownerUserId))).get(),
    listOwned: (scope: OwnerScope) =>
      db.select().from(files).where(eq(files.ownerUserId, scope.ownerUserId)).orderBy(desc(files.createdAt)).all(),
    create: (value: typeof files.$inferInsert) => db.insert(files).values(value).returning().get(),
    remove: (id: string) => db.delete(files).where(eq(files.id, id)).returning().get(),
    getPublicBrandingAsset: (id: string) =>
      db
        .select({ file: files })
        .from(files)
        .innerJoin(
          instanceBranding,
          or(
            eq(instanceBranding.lightLogoFileId, files.id),
            eq(instanceBranding.darkLogoFileId, files.id),
            eq(instanceBranding.iconFileId, files.id),
          ),
        )
        .where(
          and(
            eq(files.id, id),
            eq(files.visibility, "public_branding"),
          ),
        )
        .get()?.file,
  };
}

export type FileRepository = ReturnType<typeof createFileRepository>;
