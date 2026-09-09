import { getLivePlaybackUi } from './livePlaybackState';

describe('D3 playback presentation', () => {
  it('never shows LIVE before native playback starts', () => {
    expect(getLivePlaybackUi(false, 'loading', true)).toEqual({
      showLiveBadge: false,
      showBuffering: true,
    });
    expect(getLivePlaybackUi(false, 'readyToPlay', true).showLiveBadge).toBe(false);
  });

  it('shows LIVE only while the player confirms playback', () => {
    expect(getLivePlaybackUi(true, 'readyToPlay', true)).toEqual({
      showLiveBadge: true,
      showBuffering: false,
    });
  });

  it('does not report buffering after stream state is cleared', () => {
    expect(getLivePlaybackUi(false, 'loading', false)).toEqual({
      showLiveBadge: false,
      showBuffering: false,
    });
  });
});
