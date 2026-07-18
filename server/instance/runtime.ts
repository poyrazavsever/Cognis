import "server-only";

import { getSqliteConnection } from "../db/client";
import { InstanceService } from "./service";

export function getInstanceService(): InstanceService {
  return new InstanceService(getSqliteConnection().db);
}
