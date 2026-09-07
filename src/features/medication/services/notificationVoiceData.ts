/**
 * Pure extraction of a family-recorded reminder voice URL (UC B2) from a
 * notification data payload. Kept free of `expo-audio` so it is safe to import
 * anywhere (including unit tests) — playback lives in `reminderVoicePlayer`.
 */
export function extractVoiceUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const value = (data as Record<string, unknown>).voiceUrl;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.startsWith('http') ? trimmed : null;
}
