import { eq } from "drizzle-orm";
import { instanceSettings } from "../db/schema";
import type { DomainDatabase } from "../domain/database";

const INSTANCE_SETTINGS_KEY = "default";

export function createInstanceRepository(db: DomainDatabase) {
  return {
    get: () =>
      db
        .select()
        .from(instanceSettings)
        .where(eq(instanceSettings.key, INSTANCE_SETTINGS_KEY))
        .get(),
    createIfMissing: (instanceId: string) =>
      db
        .insert(instanceSettings)
        .values({ key: INSTANCE_SETTINGS_KEY, instanceId })
        .onConflictDoNothing({ target: instanceSettings.key })
        .run(),
  };
}
