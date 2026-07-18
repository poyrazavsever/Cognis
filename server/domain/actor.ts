import type { UserRole } from "../auth/types";
import { DomainError } from "./errors";

export type DomainActor = {
  authUserId: string;
  role: UserRole;
  clientId: string | null;
  disabled: boolean;
};

export type OwnerScope = {
  kind: "owner";
  ownerUserId: string;
};

export type ClientScope = {
  kind: "client";
  authUserId: string;
  clientId: string;
};

export function requireOwnerScope(actor: DomainActor): OwnerScope {
  assertEnabledActor(actor);

  if (actor.role !== "freelancer") {
    throw new DomainError("FORBIDDEN", "Bu işlem yalnızca instance sahibi tarafından yapılabilir.");
  }

  return { kind: "owner", ownerUserId: actor.authUserId };
}

export function requireClientScope(actor: DomainActor): ClientScope {
  assertEnabledActor(actor);

  if (actor.role !== "client" || !actor.clientId) {
    throw new DomainError("FORBIDDEN", "Geçerli bir müşteri portal hesabı gerekli.");
  }

  return { kind: "client", authUserId: actor.authUserId, clientId: actor.clientId };
}

export function assertEnabledActor(actor: DomainActor): void {
  if (actor.disabled) {
    throw new DomainError("FORBIDDEN", "Kullanıcı hesabı devre dışı.");
  }
}
