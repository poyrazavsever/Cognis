import "server-only";

import { domainActorFromSession } from "../auth/domain-actor";
import { requireClientUser } from "../auth/session";
import { getDomainService } from "../services/runtime";

export async function requirePortalBackend() {
  const context = await requireClientUser();

  return {
    context,
    actor: domainActorFromSession(context),
    service: getDomainService(),
  };
}
