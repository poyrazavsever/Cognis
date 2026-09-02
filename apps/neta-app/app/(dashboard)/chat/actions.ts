"use server";

import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, getContentFallbackLocale } from "@/server/i18n/content";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export async function listChatSessionsAction() {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);
  const sessions = service.listChatSessions(actor);
  const translations = content.listBatch("chat_session", sessions.map((session) => session.id));

  return sessions.map((session) => {
    const resolved = content.resolveEntity("chat_session", session, {
      locale: locale.locale,
      fallbackLocale: getContentFallbackLocale(locale.locale, localization),
      defaultLocale: localization.defaultLocale,
      translations: translations.get(session.id) ?? [],
    });

    return {
      id: session.id,
      title: resolved.title,
      created_at: session.createdAt.toISOString(),
    };
  });
}

export async function listChatMessagesAction(sessionId: string) {
  const { actor, service } = await requireFreelancerBackend();
  return service.listChatMessages(actor, sessionId).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    source_locale: message.sourceLocale,
  }));
}

export async function createChatSessionAction(title: string) {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const session = service.createChatSession(actor, { title });
  const content = new ContentTranslationService(getSqliteConnection().db);
  content.upsertEntityTranslations("chat_session", session.id, {
    [locale.locale]: { title },
  });
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
