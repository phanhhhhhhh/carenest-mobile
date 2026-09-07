import type { MedicationVoiceDraft } from './medicationVoiceApi';

/** Add-medication form state that a voice draft can pre-fill. */
export interface MedicationVoicePrefill {
  name?: string;
  dosage?: string;
  instructions?: string;
  /** Parsed clock times, in the order spoken. */
  times: { hour: number; minute: number }[];
  /**
   * Day indices in the add-form's convention: 0 = Monday … 6 = Sunday
   * (the form indexes `DAY_LABELS`, which starts at Monday). Empty = every day.
   */
  selectedDays: number[];
}

const HHMM = /^(\d{1,2}):(\d{2})$/;

function parseTime(value: string): { hour: number; minute: number } | null {
  const m = HHMM.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function clean(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Maps a backend voice draft onto the add-medication form's local state shape.
 * The backend speaks ISO day-of-week (1 = Mon … 7 = Sun); the form indexes a
 * Monday-first label array (0 = Mon … 6 = Sun), so days shift down by one here.
 * Malformed times/days are dropped rather than guessed — the family still
 * reviews every field before saving.
 */
export function draftToMedicationPrefill(draft: MedicationVoiceDraft): MedicationVoicePrefill {
  const times: { hour: number; minute: number }[] = [];
  for (const raw of draft.times ?? []) {
    const parsed = parseTime(raw);
    if (parsed) times.push(parsed);
  }

  const selectedDays: number[] = [];
  for (const d of draft.daysOfWeek ?? []) {
    if (Number.isInteger(d) && d >= 1 && d <= 7) {
      const index = d - 1;
      if (!selectedDays.includes(index)) selectedDays.push(index);
    }
  }
  selectedDays.sort((a, b) => a - b);

  return {
    name: clean(draft.name),
    dosage: clean(draft.dosage),
    instructions: clean(draft.instructions),
    times,
    selectedDays,
  };
}

const FIELD_LABELS: Record<string, string> = {
  name: 'tên thuốc',
  dosage: 'liều lượng',
  times: 'giờ uống',
  days: 'ngày trong tuần',
};

/**
 * Short Vietnamese hint shown under the mic button after a parse: echoes what
 * was heard and, when the extraction flagged low-confidence fields, names them
 * so the family knows what to double-check.
 */
export function voiceReviewHint(draft: MedicationVoiceDraft): string {
  const parts: string[] = [];
  if (draft.transcript?.trim()) {
    parts.push(`Đã nghe: “${draft.transcript.trim()}”`);
  }
  const uncertain = (draft.uncertainFields ?? [])
    .map((f) => FIELD_LABELS[f])
    .filter((label): label is string => Boolean(label));
  if (uncertain.length > 0) {
    parts.push(`Vui lòng kiểm tra lại: ${uncertain.join(', ')}.`);
  } else if (parts.length > 0) {
    parts.push('Kiểm tra thông tin rồi bấm lưu.');
  }
  return parts.join(' ');
}
