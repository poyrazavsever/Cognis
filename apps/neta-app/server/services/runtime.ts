import "server-only";

import { getSqliteConnection } from "../db/client";
import { DomainService } from "./domain";

export function getDomainService(): DomainService {
  return new DomainService(getSqliteConnection().db);
}
