import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

/**
 * Imperative one-shot playback of a family-recorded medication reminder voice
 * (UC B2), for contexts with no React component to host `useAudioPlayer` — i.e.
 * the push-notification handlers. Only one clip plays at a time; the player
 * releases itself when the clip finishes.
 */
let activePlayer: AudioPlayer | null = null;

export function stopReminderVoice(): void {
  if (!activePlayer) return;
  try {
    activePlayer.remove();
  } catch {
    // already released
  }
  activePlayer = null;
}

/**
 * Plays the clip at `url`. Resolves once playback has started (not when it
 * ends). Any currently-playing clip is stopped first. Safe to call with a bad
 * URL — failures are swallowed so a reminder is never blocked by audio.
 */
export async function playReminderVoice(url: string): Promise<void> {
  stopReminderVoice();
  try {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    const player = createAudioPlayer(url);
    activePlayer = player;
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && activePlayer === player) stopReminderVoice();
    });
    player.play();
  } catch {
    stopReminderVoice();
  }
}
