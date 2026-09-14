import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { getErrorMessage } from '../../../core/api/errors';

/** `.m4a` (MPEG-4 AAC) is what both RecordingPresets produce on iOS and Android. */
export const RECORDING_MIME = 'audio/mp4';

export interface RecordedClip {
  uri: string;
  mimeType: string;
}

export interface VoiceClipRecorder {
  isRecording: boolean;
  /** Milliseconds elapsed in the current recording (0 when idle). */
  durationMillis: number;
  error: string | null;
  /** Requests permission (if needed) and starts recording. Returns false on failure. */
  start: () => Promise<boolean>;
  /** Stops recording and resolves with the clip, or null if nothing was captured. */
  stop: () => Promise<RecordedClip | null>;
  /** Stops the recorder without returning a clip (discard). */
  cancel: () => Promise<void>;
  clearError: () => void;
}

/**
 * Thin wrapper over `expo-audio` recording: permission + audio-mode toggling,
 * an elapsed-time readout, a hard duration cap, and cleanup if the caller
 * unmounts mid-recording. Format is fixed to `.m4a` — the smallest clip both
 * platforms and the backend/Cloudinary all understand.
 */
export function useVoiceClipRecorder(maxDurationMs = 60_000): VoiceClipRecorder {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teardownAudioMode = useCallback(
    () => setAudioModeAsync({ allowsRecording: false }).catch(() => undefined),
    [],
  );

  const start = useCallback(async () => {
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('CareNest cần quyền micro để ghi âm.');
        return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      return true;
    } catch (e) {
      setError(`Không thể bắt đầu ghi âm: ${getErrorMessage(e)}`);
      setIsRecording(false);
      return false;
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<RecordedClip | null> => {
    try {
      await recorder.stop();
    } catch (e) {
      setError(`Không dừng được ghi âm: ${getErrorMessage(e)}`);
    } finally {
      setIsRecording(false);
      await teardownAudioMode();
    }
    return recorder.uri ? { uri: recorder.uri, mimeType: RECORDING_MIME } : null;
  }, [recorder, teardownAudioMode]);

  const cancel = useCallback(async () => {
    try {
      // `recorder.isRecording` (native, synchronous) — not `recorderState.isRecording`,
      // which is polled and can still read stale/false for a moment right after
      // start(), letting a cancel-right-after-start skip stop() and leave the
      // native recorder running in the background.
      if (recorder.isRecording) await recorder.stop();
    } catch {
      // best effort — nothing to keep anyway
    } finally {
      setIsRecording(false);
      setError(null);
      await teardownAudioMode();
    }
  }, [recorder, teardownAudioMode]);

  const clearError = useCallback(() => setError(null), []);

  // Hard cap: auto-stop a runaway recording so it can't grow unbounded.
  const cappedRef = useRef(false);
  useEffect(() => {
    if (!isRecording) {
      cappedRef.current = false;
      return;
    }
    if (recorderState.durationMillis >= maxDurationMs && !cappedRef.current) {
      cappedRef.current = true;
      void stop();
    }
  }, [isRecording, recorderState.durationMillis, maxDurationMs, stop]);

  // Discard an in-flight recording if the caller unmounts mid-capture.
  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        recorder.stop().catch(() => undefined);
        teardownAudioMode();
      }
    };
  }, [recorder, teardownAudioMode]);

  return {
    isRecording,
    durationMillis: isRecording ? recorderState.durationMillis : 0,
    error,
    start,
    stop,
    cancel,
    clearError,
  };
}
