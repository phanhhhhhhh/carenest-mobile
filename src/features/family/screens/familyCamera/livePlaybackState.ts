export interface LivePlaybackUi {
  showLiveBadge: boolean;
  showBuffering: boolean;
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
