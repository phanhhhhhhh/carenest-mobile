import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../../../core/theme';
import type { MedicationItem } from '../../../../shared/types';
import { hexToRgba, formatDoseTime } from './utils';
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

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>Xem tất cả →</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 10 }} />
      {isLoading && medItems.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : medItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyBoxText}>Chưa có thuốc nào</Text>
        </View>
      ) : (
        <View style={styles.medCardRow}>
          <MedProgressRing taken={takenMeds} total={medItems.length} />
          <View style={{ width: 14 }} />
          <View style={{ flex: 1 }}>
            {medItems.slice(0, 4).map((med) => (
              <View key={med.id} style={styles.medListRow}>
                <Text
                  style={[
                    styles.medCheckMark,
                    { color: med.taken ? Colors.success : Colors.error },
                  ]}
                >
                  {med.taken ? '✓' : '✗'}
                </Text>
                <Text style={styles.medListName} numberOfLines={1}>
                  {med.name} {med.dosage}
                </Text>
                <Text style={[styles.medListTime, !med.taken && { color: Colors.warning }]}>
                  {formatDoseTime(med)}
                  {!med.taken ? ' (sắp tới)' : ''}
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
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.25),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.primary,
  },
  loadingBox: { height: 60, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: Typography.bodySmall.fontSize },
  medCardRow: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.md },
  medListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  medCheckMark: { fontSize: 15, fontWeight: '700', width: 18 },
  medListName: {
    flex: 1,
    fontSize: Typography.buttonSmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  medListTime: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});
