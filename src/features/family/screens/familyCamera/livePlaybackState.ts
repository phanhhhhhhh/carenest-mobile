export interface LivePlaybackUi {
  showLiveBadge: boolean;
  showBuffering: boolean;
}

export interface LivePlayerControl {
  pause: () => void;
  replaceAsync: (source: null) => Promise<void>;
}

export function getLivePlaybackUi(
  isPlaying: boolean,
  playerStatus: string,
  hasStream: boolean,
): LivePlaybackUi {
  return {
    showLiveBadge: hasStream && isPlaying,
    showBuffering: hasStream && !isPlaying
      && (playerStatus === 'loading' || playerStatus === 'readyToPlay'),
  };
}

export function stopLivePlayback(player: LivePlayerControl, clearStream: () => void): void {
  player.pause();
  void player.replaceAsync(null);
  clearStream();
}
