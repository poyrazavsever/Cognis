import "server-only";

import { domainActorFromSession } from "../auth/domain-actor";
import { requireFreelancer } from "../auth/session";
import { getDomainService } from "../services/runtime";

export async function requireFreelancerBackend() {
  const context = await requireFreelancer();

  return {
    context,
    actor: domainActorFromSession(context),
    service: getDomainService(),
  };
}
