import { draftToMedicationPrefill, voiceReviewHint } from './medicationVoiceDraft';
import type { MedicationVoiceDraft } from './medicationVoiceApi';

function draft(overrides: Partial<MedicationVoiceDraft> = {}): MedicationVoiceDraft {
  return {
    transcript: null,
    name: null,
    dosage: null,
    instructions: null,
    times: [],
    daysOfWeek: [],
    uncertainFields: [],
    confident: false,
    ...overrides,
  };
}

describe('draftToMedicationPrefill', () => {
  it('trims text fields and drops blanks', () => {
    const result = draftToMedicationPrefill(
      draft({ name: '  Panadol ', dosage: '', instructions: '   ' }),
    );
    expect(result.name).toBe('Panadol');
    expect(result.dosage).toBeUndefined();
    expect(result.instructions).toBeUndefined();
  });

  it('parses valid HH:mm times and drops malformed ones', () => {
    const result = draftToMedicationPrefill(
      draft({ times: ['08:00', '9:30', '25:00', 'noon', '20:75', '21:15'] }),
    );
    expect(result.times).toEqual([
      { hour: 8, minute: 0 },
      { hour: 9, minute: 30 },
      { hour: 21, minute: 15 },
    ]);
  });

  it('shifts ISO day-of-week (1=Mon) down to the form index (0=Mon)', () => {
    const result = draftToMedicationPrefill(draft({ daysOfWeek: [1, 3, 7] }));
    // Mon, Wed, Sun -> indices 0, 2, 6
    expect(result.selectedDays).toEqual([0, 2, 6]);
  });

  it('ignores out-of-range days and de-duplicates', () => {
    const result = draftToMedicationPrefill(draft({ daysOfWeek: [0, 8, 2, 2, 5] }));
    expect(result.selectedDays).toEqual([1, 4]);
  });

  it('returns empty collections for an empty draft', () => {
    const result = draftToMedicationPrefill(draft());
    expect(result.times).toEqual([]);
    expect(result.selectedDays).toEqual([]);
  });
});

describe('voiceReviewHint', () => {
  it('echoes the transcript and lists uncertain fields in Vietnamese', () => {
    const hint = voiceReviewHint(
      draft({ transcript: 'Panadol 500mg mỗi sáng', uncertainFields: ['dosage', 'days'] }),
    );
    expect(hint).toContain('Đã nghe: “Panadol 500mg mỗi sáng”');
    expect(hint).toContain('liều lượng');
    expect(hint).toContain('ngày trong tuần');
  });

  it('gives a plain confirm nudge when nothing was flagged', () => {
    const hint = voiceReviewHint(draft({ transcript: 'thuốc huyết áp 8 giờ tối' }));
    expect(hint).toContain('Kiểm tra thông tin rồi bấm lưu.');
  });

  it('is empty when there is no transcript', () => {
    expect(voiceReviewHint(draft())).toBe('');
  });
});
