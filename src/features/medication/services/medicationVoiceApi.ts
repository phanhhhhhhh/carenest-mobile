import api from '../../../core/api/client';
import { MedicationVoiceDraftSchema, safeParseOne } from '../../../shared/schemas';

/**
 * Best-effort medication schedule extracted from a spoken description (UC B1).
 * Backend: `POST /api/medications/parse-voice` (multipart audio → transcribe →
 * Gemini extract). Never saved directly — the family reviews every field in the
 * add-medication form and confirms before it is persisted via `POST /medications`.
 */
export interface MedicationVoiceDraft {
  transcript: string | null;
  name: string | null;
  dosage: string | null;
  instructions: string | null;
  /** "HH:mm" 24h strings. */
  times: string[];
  /** ISO-8601 day-of-week: 1 = Monday … 7 = Sunday. Empty = every day. */
  daysOfWeek: number[];
  /** Field names the extraction was unsure about: "name" | "dosage" | "times" | "days". */
  uncertainFields: string[];
  confident: boolean;
}

/**
 * Uploads a recorded clip and returns the extracted draft. `.m4a` clips are sent
 * as `audio/mp4`; if a future Gemini model rejects that container, the fix is a
 * MIME tweak here or a transcode on the backend — the rest of the flow is format
 * agnostic.
 */
export async function parseMedicationVoice(
  uri: string,
  mimeType: string,
  signal?: AbortSignal,
): Promise<MedicationVoiceDraft> {
  const form = new FormData();
  const ext = mimeType.split('/').pop() || 'm4a';
  form.append('audio', {
    uri,
    name: `medication-voice.${ext}`,
    type: mimeType,
  } as unknown as Blob);

  const resp = await api.post('/medications/parse-voice', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  });

  const parsed = safeParseOne(MedicationVoiceDraftSchema, resp.data ?? {}, 'MedicationVoiceDraft');
  return {
    transcript: parsed?.transcript ?? null,
    name: parsed?.name ?? null,
    dosage: parsed?.dosage ?? null,
    instructions: parsed?.instructions ?? null,
    times: parsed?.times ?? [],
    daysOfWeek: parsed?.daysOfWeek ?? [],
    uncertainFields: parsed?.uncertainFields ?? [],
    confident: parsed?.confident ?? false,
  };
}
