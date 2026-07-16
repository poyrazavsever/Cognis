import "server-only";

import type { DomainActor } from "../domain/actor";
import type { SessionContext } from "./session";

export function domainActorFromSession(context: SessionContext): DomainActor {
  return {
    authUserId: context.user.id,
    role: context.profile.role,
    clientId: context.profile.clientId,
    disabled: context.profile.disabled,
  };
}
