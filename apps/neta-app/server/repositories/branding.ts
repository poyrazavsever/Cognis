import { eq } from "drizzle-orm";
import { instanceBranding } from "../db/schema/storage";
import type { DomainDatabase } from "../domain/database";

export function createBrandingRepository(db: DomainDatabase) {
  return {
    get: () => db.select().from(instanceBranding).where(eq(instanceBranding.id, "default")).get(),
    create: (value: typeof instanceBranding.$inferInsert) =>
      db.insert(instanceBranding).values(value).returning().get(),
    update: (value: Partial<typeof instanceBranding.$inferInsert>) =>
      db.update(instanceBranding).set(value).where(eq(instanceBranding.id, "default")).returning().get(),
  };
}
