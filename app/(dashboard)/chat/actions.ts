"use server";

import { requireFreelancerBackend } from "@/server/web/freelancer";

export async function listChatSessionsAction() {
  const { actor, service } = await requireFreelancerBackend();
  return service.listChatSessions(actor).map((session) => ({
    id: session.id,
    title: session.title,
    created_at: session.createdAt.toISOString(),
  }));
}

export async function listChatMessagesAction(sessionId: string) {
  const { actor, service } = await requireFreelancerBackend();
  return service.listChatMessages(actor, sessionId).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));
}

export async function createChatSessionAction(title: string) {
  const { actor, service } = await requireFreelancerBackend();
  const session = service.createChatSession(actor, { title });
  return {
    id: session.id,
    title: session.title,
    created_at: session.createdAt.toISOString(),
  };
}

export async function deleteChatSessionAction(sessionId: string) {
  const { actor, service } = await requireFreelancerBackend();
  service.deleteChatSession(actor, sessionId);
}
