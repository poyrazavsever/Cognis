import type { SessionRole, StoredInstance } from '@/lib/instance/types';

export const NOTIFICATION_CAPABILITY = 'mobile.notifications.v1';

export type NotificationEventType =
  | 'project.updated'
  | 'revision.requested'
  | 'revision.updated'
  | 'task.deadline';

export type NotificationData = {
  eventId: string;
  eventType: NotificationEventType;
  instanceId: string;
  projectId: string | null;
  recipientRole: SessionRole;
  recipientUserId: string;
  resourceId: string;
  schemaVersion: 1;
};

export type NotificationSession = {
  instance: Pick<StoredInstance, 'instanceId'> | null;
  user: { id: string; role: SessionRole } | null;
};

const ALLOWED_KEYS = new Set([
  'eventId',
  'eventType',
  'instanceId',
  'projectId',
  'recipientRole',
  'recipientUserId',
  'resourceId',
  'schemaVersion',
]);

const EVENT_TYPES = new Set<NotificationEventType>([
  'project.updated',
  'revision.requested',
  'revision.updated',
  'task.deadline',
]);

const IDENTIFIER = /^[A-Za-z0-9._-]{1,128}$/;

export function parseNotificationData(value: unknown): NotificationData | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !ALLOWED_KEYS.has(key))) return null;
  if (value.schemaVersion !== 1 || !isIdentifier(value.eventId) || !isEventType(value.eventType)) return null;
  if (!isIdentifier(value.instanceId) || !isIdentifier(value.recipientUserId) || !isIdentifier(value.resourceId)) return null;
  if (value.recipientRole !== 'freelancer' && value.recipientRole !== 'client') return null;
  if (value.projectId !== null && !isIdentifier(value.projectId)) return null;
  return value as NotificationData;
}

export function resolveNotificationRoute(value: unknown, session: NotificationSession): string | null {
  const data = parseNotificationData(value);
  if (!data || !session.instance || !session.user) return null;
  if (data.instanceId !== session.instance.instanceId || data.recipientUserId !== session.user.id || data.recipientRole !== session.user.role) return null;

  if (session.user.role === 'client') {
    if (data.eventType === 'revision.updated') return '/(portal)/revisions';
    if (data.eventType === 'project.updated') return '/(portal)/projects';
    return null;
  }

  if (data.eventType === 'task.deadline') return '/(owner)/tasks';
  if (data.eventType === 'revision.requested' || data.eventType === 'project.updated') return '/(owner)/projects';
  return null;
}

export function genericNotificationPreview(): { body: string; title: string } {
  return { body: 'Yeni bir güncellemeniz var. Ayrıntılar için Neta’yı açın.', title: 'Neta' };
}

function isEventType(value: unknown): value is NotificationEventType {
  return typeof value === 'string' && EVENT_TYPES.has(value as NotificationEventType);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && IDENTIFIER.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
