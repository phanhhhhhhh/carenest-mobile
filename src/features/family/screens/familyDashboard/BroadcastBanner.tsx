import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FamilyBroadcast } from '../../../../shared/types';

/**
 * Shown while a sequential Free Broadcast is walking the family (UC A3/A4).
 * Tapping "Tôi lo được" acknowledges it and stops the sequence.
 */
export function BroadcastBanner({
  broadcast,
  acknowledging,
  onAcknowledge,
}: {
  broadcast: FamilyBroadcast | undefined;
  acknowledging: boolean;
  onAcknowledge: (id: string) => void;
}) {
  if (!broadcast) return null;
  const escalated = broadcast.status === 'ESCALATED';

  return (
    <View style={[styles.card, escalated && styles.cardEscalated]}>
      <View style={styles.row}>
        <Ionicons
          name={escalated ? 'megaphone' : 'notifications'}
          size={20}
          color={escalated ? '#B91C1C' : '#B45309'}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.title}>{broadcast.title}</Text>
          <Text style={styles.body}>{broadcast.body}</Text>
          <Text style={styles.hint}>
            {escalated
              ? 'Đã báo cả nhà vì chưa ai phản hồi'
              : 'Đang lần lượt báo từng người đang rảnh'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.ackBtn}
        onPress={() => onAcknowledge(broadcast.id)}
        disabled={acknowledging}
        activeOpacity={0.85}
      >
        {acknowledging ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.ackText}>Tôi lo được</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    gap: 12,
  },
  cardEscalated: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontSize: 14.5, fontWeight: '800', color: '#0F172A' },
  body: { fontSize: 12.5, color: '#475569', marginTop: 2 },
  hint: { fontSize: 11.5, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },
  ackBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ackText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
