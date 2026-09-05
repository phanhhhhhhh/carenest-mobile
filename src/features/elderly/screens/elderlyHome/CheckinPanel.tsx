import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { CheckIn, CheckInMood } from '../../../../shared/types';

interface MoodOption {
  mood: CheckInMood;
  emoji: string;
  label: string;
  color: string;
  bg: string;
}

/** 3 mood options + a dedicated SOS button (mood 4 is handled by the SOS flow, not recorded here). */
const MOODS: MoodOption[] = [
  { mood: 1, emoji: '😊', label: 'Khỏe', color: '#047857', bg: '#ECFDF5' },
  { mood: 2, emoji: '😐', label: 'Bình thường', color: '#B45309', bg: '#FFFBEB' },
  { mood: 3, emoji: '😣', label: 'Mệt', color: '#B91C1C', bg: '#FEF2F2' },
];

export function CheckinPanel({
  today,
  submitting,
  onSelectMood,
  onSos,
}: {
  today: CheckIn | null | undefined;
  submitting: boolean;
  onSelectMood: (mood: CheckInMood) => void;
  onSos: () => void;
}) {
  const doneMood = today?.mood;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {doneMood ? 'Hôm nay bác đã báo tin' : 'Hôm nay bác thấy trong người thế nào?'}
      </Text>
      <Text style={styles.subtitle}>
        {doneMood
          ? 'Con cháu đã nhận được. Bác có thể chọn lại nếu thay đổi.'
          : 'Chạm một nút để con cháu biết bác vẫn ổn'}
      </Text>

      <View style={styles.row}>
        {MOODS.map((m) => {
          const selected = doneMood === m.mood;
          return (
            <TouchableOpacity
              key={m.mood}
              style={[
                styles.moodBtn,
                { backgroundColor: m.bg, borderColor: selected ? m.color : 'transparent' },
                selected && styles.moodBtnSelected,
              ]}
              onPress={() => onSelectMood(m.mood)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.sosBtn} onPress={onSos} activeOpacity={0.85}>
        <Text style={styles.sosEmoji}>🆘</Text>
        <Text style={styles.sosLabel}>Cần giúp gấp</Text>
      </TouchableOpacity>

      {submitting && (
        <View style={styles.submittingRow}>
          <ActivityIndicator size="small" color="#64748B" />
          <Text style={styles.submittingText}>Đang gửi...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 3, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  moodBtn: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  moodBtnSelected: { transform: [{ scale: 1.03 }] },
  moodEmoji: { fontSize: 34 },
  moodLabel: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  sosBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E11D48',
    borderRadius: 18,
    paddingVertical: 14,
  },
  sosEmoji: { fontSize: 22 },
  sosLabel: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800', letterSpacing: 0.3 },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  submittingText: { color: '#64748B', fontSize: 13 },
});
