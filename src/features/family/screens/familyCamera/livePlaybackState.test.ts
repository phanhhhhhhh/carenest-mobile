import fs from 'node:fs';
import path from 'node:path';
import { getLivePlaybackUi, stopLivePlayback } from './livePlaybackState';

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

  it('stops playback and clears the sensitive stream during screen cleanup', () => {
    const player = { pause: jest.fn(), replaceAsync: jest.fn().mockResolvedValue(undefined) };
    const clearStream = jest.fn();

    stopLivePlayback(player, clearStream);

    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(player.replaceAsync).toHaveBeenCalledWith(null);
    expect(clearStream).toHaveBeenCalledTimes(1);
  });

  it('keeps the D3 screen view-only', () => {
    const screen = fs.readFileSync(path.join(__dirname, '..', 'FamilyLiveCameraScreen.tsx'), 'utf8');

    expect(screen).not.toMatch(/snapshot|capture|ptz|two.?way|voice|microphone/i);
  });
});
