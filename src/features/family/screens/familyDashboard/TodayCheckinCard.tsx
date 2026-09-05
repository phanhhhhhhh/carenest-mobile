import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CheckIn } from '../../../../shared/types';

const MOOD_META: Record<number, { emoji: string; label: string; color: string; bg: string }> = {
  1: { emoji: '😊', label: 'Khỏe mạnh', color: '#047857', bg: '#ECFDF5' },
  2: { emoji: '😐', label: 'Bình thường', color: '#B45309', bg: '#FFFBEB' },
  3: { emoji: '😣', label: 'Thấy mệt', color: '#B91C1C', bg: '#FEF2F2' },
  4: { emoji: '🆘', label: 'Cần giúp gấp', color: '#B91C1C', bg: '#FEF2F2' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Shows the elderly's daily 1-touch check-in for today (UC A1). */
export function TodayCheckinCard({ checkIn }: { checkIn: CheckIn | null | undefined }) {
  // `undefined` = not loaded yet; `null` = loaded, none today.
  if (checkIn === undefined) return null;

  if (checkIn === null) {
    return (
      <View style={[styles.card, styles.pendingCard]}>
        <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
          <Ionicons name="time-outline" size={22} color="#64748B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chưa báo tin hôm nay</Text>
          <Text style={styles.subtitle}>Ông/bà chưa chạm nút trạng thái sáng nay</Text>
        </View>
      </View>
    );
  }

  const meta = MOOD_META[checkIn.mood] ?? MOOD_META[2];
  return (
    <View style={[styles.card, { backgroundColor: meta.bg, borderColor: meta.color + '33' }]}>
      <Text style={styles.emoji}>{meta.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: meta.color }]}>{meta.label}</Text>
        <Text style={styles.subtitle}>Đã báo tin lúc {formatTime(checkIn.createdAt)} hôm nay</Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={meta.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  pendingCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 32 },
  title: { fontSize: 15.5, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 12.5, color: '#64748B', marginTop: 2 },
});
