import { extractVoiceUrl } from './notificationVoiceData';

describe('extractVoiceUrl', () => {
  it('returns an https voice url from a notification payload', () => {
    expect(
      extractVoiceUrl({
        type: 'MEDICATION_REMINDER',
        voiceUrl: 'https://res.cloudinary.com/x/a.m4a',
      }),
    ).toBe('https://res.cloudinary.com/x/a.m4a');
  });

  it('trims surrounding whitespace', () => {
    expect(extractVoiceUrl({ voiceUrl: '  https://x/a.m4a  ' })).toBe('https://x/a.m4a');
  });

  it('rejects non-http values, empty strings and non-strings', () => {
    expect(extractVoiceUrl({ voiceUrl: '' })).toBeNull();
    expect(extractVoiceUrl({ voiceUrl: 'file:///tmp/a.m4a' })).toBeNull();
    expect(extractVoiceUrl({ voiceUrl: 42 })).toBeNull();
    expect(extractVoiceUrl({ type: 'MEDICATION_REMINDER' })).toBeNull();
  });

  it('handles missing or non-object payloads', () => {
    expect(extractVoiceUrl(null)).toBeNull();
    expect(extractVoiceUrl(undefined)).toBeNull();
    expect(extractVoiceUrl('nope')).toBeNull();
  });
});
