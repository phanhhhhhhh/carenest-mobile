import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
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
        <View style={styles.headerLeft}>
          <Text style={styles.complianceHeaderTitle}>Tỉ lệ tuân thủ uống thuốc</Text>
          <Text style={styles.complianceSubtitle}>Theo dõi trong {rangeDays} ngày gần nhất</Text>
        </View>
        <TouchableOpacity
          style={styles.rangeDropdown}
          onPress={onOpenRangePicker}
          activeOpacity={0.8}
        >
          <Text style={styles.rangeDropdownText}>{rangeDays} ngày</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {average !== null && (
        <>
          <View style={{ height: 16 }} />
          <View style={styles.averageRow}>
            <Text style={styles.averageNumber}>{average}%</Text>
            <Text style={styles.averageLabel}>trung bình hoàn thành đúng giờ</Text>
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
            const barHeight = ratio === null ? 0 : Math.max(6, ratio * 84);
            const isLow = ratio !== null && ratio < 0.5;
            const fillColor = isLow ? '#D97706' : isToday ? Colors.primary : '#5EEAD4';
            return (
              <View key={label} style={styles.weekBarCol}>
                <View style={styles.weekBarTrack}>
                  {ratio !== null && (
                    <>
                      <Text style={styles.weekBarValue}>{Math.round(ratio * 100)}%</Text>
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

      <View style={{ height: 16 }} />
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Đạt chỉ tiêu</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
          <Text style={styles.legendText}>Cần chú ý (&lt;50%)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  complianceCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  complianceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  complianceHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  complianceSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 2, fontWeight: '500' },
  rangeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E6F7F5',
    borderWidth: 1,
    borderColor: '#99E6E0',
  },
  rangeDropdownText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  averageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  averageNumber: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  averageLabel: { fontSize: 13.5, color: '#64748B', fontWeight: '500' },
  weekBarChart: { height: 130, justifyContent: 'flex-end', position: 'relative' },
  weekBarGridline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  weekBarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  weekBarCol: { flex: 1, alignItems: 'center' },
  weekBarTrack: { height: 100, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  weekBarValue: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginBottom: 4 },
  weekBarFill: { width: 14, borderRadius: 6 },
  weekBarLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  weekBarLabelActive: { color: Colors.primary, fontWeight: '800' },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
});
