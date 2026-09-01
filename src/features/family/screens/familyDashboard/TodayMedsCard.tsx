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

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="medkit" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
        </View>
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>Xem tất cả →</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 14 }} />

      {isLoading && medItems.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : medItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="medkit-outline" size={32} color={Colors.textHint} />
          <Text style={styles.emptyBoxText}>Chưa có lịch uống thuốc</Text>
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
                    { backgroundColor: med.taken ? Colors.successLight : Colors.warningLight },
                  ]}
                >
                  <Ionicons
                    name={med.taken ? 'checkmark' : 'time-outline'}
                    size={13}
                    color={med.taken ? Colors.successDark : Colors.warningDark}
                  />
                </View>
                <Text style={styles.medListName} numberOfLines={1}>
                  {med.name}
                </Text>
                <Text
                  style={[
                    styles.medListTime,
                    { color: med.taken ? Colors.textSecondary : Colors.warningDark },
                  ]}
                >
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
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  loadingBox: { height: 60, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    gap: 6,
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: 13 },
  medCardRow: { flexDirection: 'row', alignItems: 'center' },
  medListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
  medCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medListName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  medListTime: { fontSize: 12, fontWeight: '700' },
});
