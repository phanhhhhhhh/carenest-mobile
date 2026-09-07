import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { getErrorMessage } from '../../../core/api/errors';
import { parseMedicationVoice, type MedicationVoiceDraft } from '../services/medicationVoiceApi';

export type VoiceInputStatus = 'idle' | 'recording' | 'processing';

/** `.m4a` (MPEG-4 AAC) is what both RecordingPresets produce on iOS and Android. */
const RECORDING_MIME = 'audio/mp4';

/** Cap a single utterance so an accidentally-left-on mic can't hit the 10 MB backend limit. */
const MAX_RECORDING_MS = 60_000;

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

export function useMedicationVoiceInput(): MedicationVoiceInput {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('CareNest cần quyền micro để nhập thuốc bằng giọng nói.');
        return false;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus('recording');
      return true;
    } catch (e) {
      setError(`Không thể bắt đầu ghi âm: ${getErrorMessage(e)}`);
      setStatus('idle');
      return false;
    }
  }, [recorder]);

  const finish = useCallback(async (): Promise<string | null> => {
    try {
      await recorder.stop();
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    }
    return recorder.uri;
  }, [recorder]);

  const stopAndParse = useCallback(async (): Promise<MedicationVoiceDraft | null> => {
    setStatus('processing');
    try {
      const uri = await finish();
      if (!uri) {
        setError('Không ghi được âm thanh. Vui lòng thử lại.');
        return null;
      }
      return await parseMedicationVoice(uri, RECORDING_MIME);
    } catch (e) {
      setError(`Xử lý giọng nói thất bại: ${getErrorMessage(e)}`);
      return null;
    } finally {
      setStatus('idle');
    }
  }, [finish]);

  const cancel = useCallback(async () => {
    try {
      if (recorderState.isRecording) await finish();
    } catch {
      // best effort — nothing to upload anyway
    }
    setStatus('idle');
    setError(null);
  }, [finish, recorderState.isRecording]);

  const clearError = useCallback(() => setError(null), []);

  // Stop (and discard) an in-flight recording if the form closes mid-capture.
  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        recorder.stop().catch(() => undefined);
        setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      }
    };
  }, [recorder]);

  // Safety valve: auto-stop-and-parse a runaway recording once it hits the cap.
  const autoStopped = useRef(false);
  useEffect(() => {
    if (status !== 'recording') {
      autoStopped.current = false;
      return;
    }
    if (recorderState.durationMillis >= MAX_RECORDING_MS && !autoStopped.current) {
      autoStopped.current = true;
      void stopAndParse();
    }
  }, [status, recorderState.durationMillis, stopAndParse]);

  return {
    status,
    error,
    durationMillis: status === 'recording' ? recorderState.durationMillis : 0,
    start,
    stopAndParse,
    cancel,
    clearError,
  };
}
