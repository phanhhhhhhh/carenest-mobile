import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { HISTORY_DAY_LABELS } from './constants';

interface Props {
  displayAdherence: (number | null)[];
  rangeDays: 7 | 30;
  onOpenRangePicker: () => void;
}

export function ComplianceCard({ displayAdherence, rangeDays, onOpenRangePicker }: Props) {
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0 ... Sun=6
  const knownRatios = displayAdherence.filter((v): v is number => v !== null);
  const average =
    knownRatios.length > 0
      ? Math.round((knownRatios.reduce((sum, v) => sum + v, 0) / knownRatios.length) * 100)
      : null;

  return (
    <View style={styles.complianceCard}>
      <View style={styles.complianceHeaderRow}>
        <Text style={styles.complianceHeaderTitle}>Tỉ lệ tuân thủ · {rangeDays} ngày</Text>
        <TouchableOpacity style={styles.rangeDropdown} onPress={onOpenRangePicker}>
          <Text style={styles.rangeDropdownText}>{rangeDays} ngày</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {average !== null && (
        <>
          <View style={{ height: 10 }} />
          <View style={styles.averageRow}>
            <Text style={styles.averageNumber}>{average}%</Text>
            <Text style={styles.averageLabel}>trung bình {rangeDays} ngày</Text>
          </View>
        </>
      )}

      <View style={{ height: 18 }} />

      <View style={styles.weekBarChart}>
        <View style={styles.weekBarGridline} />
        <View style={[styles.weekBarGridline, { bottom: 24 + 84 / 2 }]} />
        <View style={styles.weekBarRow}>
          {HISTORY_DAY_LABELS.map((label, i) => {
            const isToday = i === todayIndex;
            const ratio = displayAdherence[i];
            // Cột tính từ logs thật; null = ngày tương lai hoặc không có
            // cữ thuốc nào -> chỉ vẽ track rỗng.
            const barHeight = ratio === null ? 0 : Math.max(4, ratio * 84);
            const isLow = ratio !== null && ratio < 0.5;
            const fillColor = isLow
              ? Colors.warning
              : isToday
                ? Colors.primary
                : Colors.primaryLight;
            return (
              <View key={label} style={styles.weekBarCol}>
                <View style={styles.weekBarTrack}>
                  {ratio !== null && (
                    <>
                      <Text style={styles.weekBarValue}>{Math.round(ratio * 100)}</Text>
                      <View
                        style={[
                          styles.weekBarFill,
                          { height: barHeight, backgroundColor: fillColor },
                        ]}
                      />
                    </>
                  )}
                </View>
                <View style={{ height: 6 }} />
                <Text style={[styles.weekBarLabel, isToday && styles.weekBarLabelActive]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: 14 }} />
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primaryLight }]} />
          <Text style={styles.legendText}>Đạt</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.legendText}>Cần chú ý (dưới 50%)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  complianceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.2)',
  },
  complianceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complianceHeaderTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  rangeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(173,181,189,0.4)',
  },
  rangeDropdownText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  averageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  averageNumber: { fontSize: 32, fontWeight: '700', color: Colors.textPrimary },
  averageLabel: { fontSize: 13, color: Colors.textSecondary },
  weekBarChart: { position: 'relative' },
  weekBarGridline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    height: 1,
    backgroundColor: Colors.divider,
  },
  weekBarRow: { flexDirection: 'row' },
  weekBarCol: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  weekBarTrack: { width: 22, height: 108, justifyContent: 'flex-end', alignItems: 'center' },
  weekBarValue: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  weekBarFill: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  weekBarLabel: { color: Colors.textHint, fontSize: 11 },
  weekBarLabelActive: { color: Colors.primary, fontWeight: '700' },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary },
});
