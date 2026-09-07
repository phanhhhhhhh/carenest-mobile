import { useCallback, useState } from 'react';
import { getErrorMessage } from '../../../core/api/errors';
import { uploadVoiceClip } from '../services/cloudinaryUpload';
import { useVoiceClipRecorder } from './useVoiceClipRecorder';

export type ReminderVoiceStatus = 'idle' | 'recording' | 'uploading';

/** Reminder clips are short prompts ("Bố ơi, nhớ uống thuốc huyết áp nhé"). */
const MAX_REMINDER_MS = 20_000;

interface ReminderVoiceRecorder {
  status: ReminderVoiceStatus;
  durationMillis: number;
  error: string | null;
  start: () => Promise<boolean>;
  /** Stops recording, uploads to Cloudinary, resolves with the hosted URL (or null on failure). */
  stopAndUpload: () => Promise<string | null>;
  cancel: () => Promise<void>;
  clearError: () => void;
}

/**
 * Records a family member's custom medication-reminder voice (UC B2) and uploads
 * it to Cloudinary. The caller stores the returned URL as `medication.voiceUrl`;
 * the backend only plays it at reminder time when a linked member has Family Plus.
 */
export function useReminderVoiceRecorder(): ReminderVoiceRecorder {
  const recorder = useVoiceClipRecorder(MAX_REMINDER_MS);
  const [status, setStatus] = useState<ReminderVoiceStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setUploadError(null);
    const ok = await recorder.start();
    if (ok) setStatus('recording');
    return ok;
  }, [recorder]);

  const stopAndUpload = useCallback(async (): Promise<string | null> => {
    setStatus('uploading');
    try {
      const clip = await recorder.stop();
      if (!clip) {
        setUploadError('Không ghi được âm thanh. Vui lòng thử lại.');
        return null;
      }
      return await uploadVoiceClip(clip.uri, clip.mimeType);
    } catch (e) {
      setUploadError(`Tải giọng nhắc lên thất bại: ${getErrorMessage(e)}`);
      return null;
    } finally {
      setStatus('idle');
    }
  }, [recorder]);

  const cancel = useCallback(async () => {
    await recorder.cancel();
    setStatus('idle');
    setUploadError(null);
  }, [recorder]);

  const clearError = useCallback(() => {
    setUploadError(null);
    recorder.clearError();
  }, [recorder]);

  return {
    status,
    durationMillis: status === 'recording' ? recorder.durationMillis : 0,
    error: uploadError ?? recorder.error,
    start,
    stopAndUpload,
    cancel,
    clearError,
  };
}
