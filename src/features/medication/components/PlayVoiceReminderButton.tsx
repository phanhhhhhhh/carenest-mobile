import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Colors } from '../../../core/theme/colors';
import { stopReminderVoice } from '../services/reminderVoicePlayer';

/**
 * "Nghe lời nhắc" — replays the family-recorded reminder voice (UC B2) on the
 * elderly medication screen, so a missed audible reminder can still be heard.
 * The player is scoped to this component and releases on unmount.
 */
export function PlayVoiceReminderButton({ url, big = false }: { url: string; big?: boolean }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const playing = status.playing;

  const toggle = () => {
    if (playing) {
      player.pause();
      return;
    }
    // Silence any clip the notification handler started so they don't overlap.
    stopReminderVoice();
    player.seekTo(0);
    player.play();
  };

  return (
    <TouchableOpacity
      style={[styles.btn, big && styles.btnBig]}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <Ionicons
        name={playing ? 'pause' : 'volume-high'}
        size={big ? 20 : 16}
        color={Colors.primary}
      />
      <Text style={[styles.label, big && styles.labelBig]}>
        {playing ? 'Đang phát lời nhắc…' : 'Nghe lời nhắc của người thân'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(46,125,154,0.08)',
  },
  btnBig: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  label: { fontSize: 12.5, fontWeight: '700', color: Colors.primary },
  labelBig: { fontSize: 14.5 },
});
