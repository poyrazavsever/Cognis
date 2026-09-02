import { randomUUID } from "node:crypto";
import type { DomainDatabase } from "../domain/database";
import { DomainError } from "../domain/errors";
import { createInstanceRepository } from "../repositories/instance";

export type InstanceIdentity = {
  instanceId: string;
  createdAt: string;
};

export class InstanceService {
  private readonly repository;

  constructor(private readonly db: DomainDatabase) {
    this.repository = createInstanceRepository(db);
  }

  getIdentity(): InstanceIdentity {
    const existing = this.repository.get();
    if (existing) return toIdentity(existing);

    this.repository.createIfMissing(randomUUID());
    const created = this.repository.get();
    if (!created) {
      throw new DomainError(
        "INVARIANT_VIOLATION",
        "Instance kimliği oluşturulamadı.",
      );
    }
    return toIdentity(created);
  }
}

function toIdentity(value: {
  instanceId: string;
  createdAt: string;
}): InstanceIdentity {
  return {
    instanceId: value.instanceId,
    createdAt: sqliteTimestampToIso(value.createdAt),
  };
}

function sqliteTimestampToIso(value: string): string {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const timestamp = new Date(normalized);
  if (Number.isNaN(timestamp.getTime())) {
    throw new DomainError(
      "INVARIANT_VIOLATION",
      "Instance oluşturulma zamanı geçersiz.",
    );
  }
  return timestamp.toISOString();
}
