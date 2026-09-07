import { useCallback, useState } from 'react';
import { getErrorMessage } from '../../../core/api/errors';
import { parseMedicationVoice, type MedicationVoiceDraft } from '../services/medicationVoiceApi';
import { useVoiceClipRecorder } from './useVoiceClipRecorder';

export type VoiceInputStatus = 'idle' | 'recording' | 'processing';

interface MedicationVoiceInput {
  status: VoiceInputStatus;
  error: string | null;
  /** Milliseconds elapsed in the current recording (0 when idle). */
  durationMillis: number;
  /** Requests permission (if needed) and starts recording. Returns false on failure. */
  start: () => Promise<boolean>;
  /** Stops recording, uploads the clip, and resolves with the parsed draft (or null on failure). */
  stopAndParse: () => Promise<MedicationVoiceDraft | null>;
  /** Aborts the current recording without uploading. */
  cancel: () => Promise<void>;
  clearError: () => void;
}

/**
 * Voice entry for the add-medication form (UC B1): record a spoken description,
 * send it to `POST /medications/parse-voice`, and hand back the extracted draft
 * for the family to review. Nothing is saved here.
 */
export function useMedicationVoiceInput(): MedicationVoiceInput {
  const recorder = useVoiceClipRecorder(60_000);
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [parseError, setParseError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setParseError(null);
    const ok = await recorder.start();
    if (ok) setStatus('recording');
    return ok;
  }, [recorder]);

  const stopAndParse = useCallback(async (): Promise<MedicationVoiceDraft | null> => {
    setStatus('processing');
    try {
      const clip = await recorder.stop();
      if (!clip) {
        setParseError('Không ghi được âm thanh. Vui lòng thử lại.');
        return null;
      }
      return await parseMedicationVoice(clip.uri, clip.mimeType);
    } catch (e) {
      setParseError(`Xử lý giọng nói thất bại: ${getErrorMessage(e)}`);
      return null;
    } finally {
      setStatus('idle');
    }
  }, [recorder]);

  const cancel = useCallback(async () => {
    await recorder.cancel();
    setStatus('idle');
    setParseError(null);
  }, [recorder]);

  const clearError = useCallback(() => {
    setParseError(null);
    recorder.clearError();
  }, [recorder]);

  return {
    status,
    error: parseError ?? recorder.error,
    durationMillis: status === 'recording' ? recorder.durationMillis : 0,
    start,
    stopAndParse,
    cancel,
    clearError,
  };
}
