import "server-only";

import { getServerConfig } from "../config";
import { getSqliteConnection } from "../db/client";
import { FileService } from "./service";

export function getFileService(): FileService {
  const config = getServerConfig();
  return new FileService(getSqliteConnection().db, {
    uploadsDir: config.uploadsDir,
    tmpDir: config.tmpDir,
  });
}
