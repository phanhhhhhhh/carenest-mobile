import { z } from 'zod';

/**
 * Runtime validation for API responses. Each schema is intentionally lenient
 * on optional/cosmetic fields (coerced with sensible defaults) but strict on
 * fields the UI actually depends on, so a backend contract drift is caught
 * here instead of silently producing `undefined` deep inside a screen.
 */

export const UserSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.enum(['ELDERLY', 'FAMILY']),
});
export type UserParsed = z.infer<typeof UserSchema>;

export const MedicationScheduleSchema = z.object({
  times: z.array(z.string()).optional(),
  daysOfWeek: z.array(z.number()).optional(),
});

export const MedicationSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  dosage: z.string(),
  instructions: z.string().optional().nullable(),
  nextDoseTime: z.string().optional().nullable(),
  schedule: MedicationScheduleSchema.optional().nullable(),
});
export type MedicationParsed = z.infer<typeof MedicationSchema>;

export const MedicationLogSchema = z.object({
  id: z.coerce.string(),
  medicationId: z.coerce.string().optional(),
  status: z.enum(['TAKEN', 'MISSED', 'SKIPPED']),
  takenAt: z.string(),
});
export type MedicationLogParsed = z.infer<typeof MedicationLogSchema>;

export const HealthMetricSchema = z.object({
  id: z.coerce.string(),
  type: z.string(),
  value: z.union([z.string(), z.number()]),
  valueSecondary: z.union([z.string(), z.number()]).optional().nullable(),
  unit: z.string().optional().nullable(),
  recordedAt: z.string(),
});
export type HealthMetricParsed = z.infer<typeof HealthMetricSchema>;

export const AppointmentSchema = z.object({
  id: z.coerce.string(),
  doctor: z.string(),
  specialty: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  datetime: z.string(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  notes: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});
export type AppointmentParsed = z.infer<typeof AppointmentSchema>;

export const EmergencyEventSchema = z.object({
  id: z.coerce.string(),
  type: z.string().optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string(),
  triggeredAt: z.string().optional(),
  createdAt: z.string().optional(),
});
export type EmergencyEventParsed = z.infer<typeof EmergencyEventSchema>;

export const FamilyLinkSchema = z.object({
  id: z.coerce.string().optional(),
  linkId: z.coerce.string().optional(),
  elderlyId: z.coerce.string().optional(),
  elderlyName: z.string().optional(),
  familyId: z.coerce.string().optional(),
  familyName: z.string().optional(),
  relationship: z.string().optional().nullable(),
  status: z.string().optional(),
  healthConditions: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
});
export type FamilyLinkParsed = z.infer<typeof FamilyLinkSchema>;

export const NotificationSchema = z.object({
  id: z.coerce.string(),
  title: z.string(),
  body: z.string().optional().nullable(),
  type: z.string(),
  readAt: z.string().optional().nullable(),
  createdAt: z.string(),
});
export type NotificationParsed = z.infer<typeof NotificationSchema>;

export const WeeklySummarySchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  body: z.string().optional(),
  summary: z.string().optional(),
  medicationAdherence: z.union([z.number(), z.null()]).optional(),
  totalMetrics: z.number().optional(),
  abnormalMetrics: z.number().optional(),
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
  createdAt: z.string().optional(),
});
export type WeeklySummaryParsed = z.infer<typeof WeeklySummarySchema>;

export const CameraDeviceSchema = z.object({
  id: z.coerce.number(),
  label: z.string().optional(),
  deviceSn: z.string().optional(),
  status: z.string().optional(),
  privacyMode: z.boolean().optional(),
  motionDetectionEnabled: z.boolean().optional(),
  snapshotSchedule: z.string().optional().nullable(),
});
export type CameraDeviceParsed = z.infer<typeof CameraDeviceSchema>;

export const CameraStatusSchema = z.object({
  hasCamera: z.boolean(),
  cameraCount: z.number().optional(),
  allOnline: z.boolean().optional(),
  indicatorColor: z.string().optional(),
  statusText: z.string().optional(),
  message: z.string().optional(),
});
export type CameraStatusParsed = z.infer<typeof CameraStatusSchema>;

export const CameraSnapshotSchema = z.object({
  id: z.coerce.number(),
  imageUrl: z.string().optional().nullable(),
  trigger: z.string().optional(),
  success: z.boolean().optional(),
  createdAt: z.string().optional(),
});
export type CameraSnapshotParsed = z.infer<typeof CameraSnapshotSchema>;

export const ChatMessageSchema = z.object({
  messageId: z.coerce.number().optional(),
  role: z.enum(['USER', 'AI']).optional(),
  content: z.string().optional(),
  intent: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  transcription: z.string().optional(),
});
export type ChatMessageParsed = z.infer<typeof ChatMessageSchema>;

export const HealthThresholdSchema = z.object({
  id: z.coerce.number(),
  metricType: z.string(),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable(),
  minValueSecondary: z.number().optional().nullable(),
  maxValueSecondary: z.number().optional().nullable(),
  alertFamily: z.boolean().optional(),
});
export type HealthThresholdParsed = z.infer<typeof HealthThresholdSchema>;

export const HealthThresholdRecommendationSchema = z.object({
  metricType: z.string(),
  minValue: z.number().optional().nullable(),
  maxValue: z.number().optional().nullable(),
  minValueSecondary: z.number().optional().nullable(),
  maxValueSecondary: z.number().optional().nullable(),
});
export type HealthThresholdRecommendationParsed = z.infer<typeof HealthThresholdRecommendationSchema>;

export const NotificationPreferencesSchema = z.object({
  medicationReminder: z.boolean().optional(),
  reminderMinutesBefore: z.number().optional(),
  healthAlert: z.boolean().optional(),
  familyUpdate: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});
export type NotificationPreferencesParsed = z.infer<typeof NotificationPreferencesSchema>;

export const ElderlyProfileSchema = z.object({
  id: z.coerce.string().optional(),
  userName: z.string().optional(),
  healthConditions: z.array(z.string()).optional(),
  bloodType: z.string().optional().nullable(),
  weightKg: z.number().optional().nullable(),
  heightCm: z.number().optional().nullable(),
  allergies: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  notes: z.string().optional().nullable(),
  emergencyContacts: z
    .array(
      z.object({
        id: z.coerce.string().optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
        relationship: z.string().optional(),
      }),
    )
    .optional()
    .nullable(),
});
export type ElderlyProfileParsed = z.infer<typeof ElderlyProfileSchema>;

export const GoogleFitStatusSchema = z.object({
  connected: z.boolean(),
  configured: z.boolean(),
});
export type GoogleFitStatusParsed = z.infer<typeof GoogleFitStatusSchema>;

/**
 * Validates a single API object with `schema`. On failure, logs a warning
 * naming the offending field(s) and returns null so the caller can skip the
 * item / fall back to previous state instead of injecting `undefined`.
 */
export function safeParseOne<T>(schema: z.ZodType<T>, raw: unknown, context: string): T | null {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;

  const fields = result.error.issues.map((i) => i.path.join('.') || '(root)').join(', ');
  console.warn(`[schema] ${context}: invalid response — offending field(s): ${fields}`, result.error.issues);
  return null;
}

/**
 * Validates an array of raw API objects, dropping items that fail validation
 * (with a warning) rather than letting a malformed item silently produce
 * blank/undefined fields in the UI.
 */
export function safeParseList<T>(schema: z.ZodType<T>, raw: unknown, context: string): T[] {
  if (!Array.isArray(raw)) {
    console.warn(`[schema] ${context}: expected an array, got ${typeof raw}`);
    return [];
  }
  const out: T[] = [];
  for (const item of raw) {
    const parsed = safeParseOne(schema, item, context);
    if (parsed != null) out.push(parsed);
  }
  return out;
}
