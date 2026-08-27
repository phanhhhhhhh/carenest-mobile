import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { CameraSnapshotData } from '../../store/cameraStore';
import { formatTime, triggerColor, triggerIcon, triggerLabel } from './utils';

export function Timeline({ timeline }: { timeline: CameraSnapshotData[] }) {
  if (timeline.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="images-outline" size={56} color={Colors.textHint} />
        <View style={{ height: 12 }} />
        <Text style={styles.emptyText}>Chưa có lịch sử kiểm tra</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listPad}>
      {timeline.map((snap) => (
        <View key={snap.id} style={styles.timelineCard}>
          <View
            style={[
              styles.timelineIconWrap,
              { backgroundColor: `${triggerColor(snap.trigger)}1A` },
            ]}
          >
            <Ionicons
              name={triggerIcon(snap.trigger)}
              size={22}
              color={triggerColor(snap.trigger)}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.timelineTitle}>{triggerLabel(snap.trigger)}</Text>
            <View style={{ height: 2 }} />
            <Text style={styles.timelineTime}>{formatTime(snap.createdAt)}</Text>
          </View>
          {snap.imageUrl.length > 0 ? (
            <Image source={{ uri: snap.imageUrl }} style={styles.timelineThumb} />
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  listPad: { padding: 16 },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  timelineIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineTitle: { fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  timelineTime: { color: Colors.textSecondary, fontSize: 12 },
  timelineThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: Colors.background },
});
