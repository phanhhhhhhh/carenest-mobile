import { normalizeElderlyId } from './elderlyId';

export const VISIT_NOTIFICATION_TYPES = [
  'VISIT_STREAK_REMINDER',
  'VISIT_CONFIRMED',
  'VISIT_BIRTHDAY_REMINDER',
  'VISIT_TET_REMINDER',
] as const;

export type VisitNotificationType = (typeof VISIT_NOTIFICATION_TYPES)[number];

export interface VisitNotificationDestination {
  name: 'FamilyVisitStreak';
  params: { elderlyId: string };
}

export function isVisitNotificationType(value: unknown): value is VisitNotificationType {
  return (
    typeof value === 'string' && (VISIT_NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}

export function getVisitNotificationDestination(
  payload: Record<string, unknown> | null | undefined,
): VisitNotificationDestination | null {
  if (!isVisitNotificationType(payload?.type)) return null;
  const elderlyId = normalizeElderlyId(payload?.elderlyId);
  return elderlyId ? { name: 'FamilyVisitStreak', params: { elderlyId } } : null;
}
