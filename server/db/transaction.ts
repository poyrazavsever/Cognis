import "server-only";

import { getSqliteConnection, type SqliteConnection } from "@/server/db/client";

let transactionDepth = 0;

export function runInTransaction<T>(operation: (connection: SqliteConnection) => T): T {
  const connection = getSqliteConnection();

  if (transactionDepth > 0) {
    return operation(connection);
  }

  const execute = connection.sqlite.transaction(() => {
    transactionDepth += 1;

    try {
      return operation(connection);
    } finally {
      transactionDepth -= 1;
    }
  });

  return execute();
}
