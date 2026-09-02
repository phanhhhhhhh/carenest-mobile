import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { MedicationItem } from '../../../../shared/types';
import { formatDoseTime } from './utils';
import { MedProgressRing } from './widgets';

export function TodayMedsCard({
  medItems,
  isLoading,
  onViewAll,
}: {
  medItems: MedicationItem[];
  isLoading: boolean;
  onViewAll: () => void;
}) {
  const takenMeds = medItems.filter((m) => m.taken).length;
  const adherenceRate = medItems.length > 0 ? Math.round((takenMeds / medItems.length) * 100) : 0;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="medkit" size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Thuốc trong ngày</Text>
            <Text style={styles.sectionSub}>Tiến độ: {adherenceRate}% đã hoàn thành</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onViewAll}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>Chi tiết →</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 16 }} />

      {isLoading && medItems.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : medItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="medkit-outline" size={36} color="#94A3B8" />
          <Text style={styles.emptyBoxText}>Người thân chưa có lịch uống thuốc nào hôm nay</Text>
        </View>
      ) : (
        <View style={styles.medCardRow}>
          <MedProgressRing taken={takenMeds} total={medItems.length} />
          <View style={{ width: 18 }} />
          <View style={{ flex: 1 }}>
            {medItems.slice(0, 4).map((med) => (
              <View key={med.id} style={styles.medListRow}>
                <View
                  style={[
                    styles.medCheckBadge,
                    { backgroundColor: med.taken ? '#DCFCE7' : '#FEF3C7' },
                  ]}
                >
                  <Ionicons
                    name={med.taken ? 'checkmark' : 'time-outline'}
                    size={14}
                    color={med.taken ? '#15803D' : '#D97706'}
                  />
                </View>
                <Text style={styles.medListName} numberOfLines={1}>
                  {med.name}
                </Text>
                <Text style={[styles.medListTime, { color: med.taken ? '#64748B' : '#D97706' }]}>
                  {formatDoseTime(med)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  viewAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E6F7F5',
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  loadingBox: { height: 70, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    gap: 8,
  },
  emptyBoxText: { color: '#64748B', fontSize: 13.5, textAlign: 'center' },
  medCardRow: { flexDirection: 'row', alignItems: 'center' },
  medListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  medCheckBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medListName: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  medListTime: { fontSize: 12.5, fontWeight: '700' },
});
