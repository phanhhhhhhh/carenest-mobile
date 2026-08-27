import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../../../core/theme';
import { hexToRgba } from './utils';
import { VitalMiniCard } from './widgets';

interface Props {
  hasElderly: boolean;
  elderlyName: string;
  lastUpdatedLabel: string | null;
  isRecentlyActive: boolean;
  healthConditions: string[];
  showVitals: boolean;
  hrText: string;
  bpText: string;
  glucoseText: string;
  isHrWarning: boolean;
  isBpWarning: boolean;
  isGlucoseWarning: boolean;
  onVitalPress: () => void;
}

export function ElderlyCard({
  hasElderly,
  elderlyName,
  lastUpdatedLabel,
  isRecentlyActive,
  healthConditions,
  showVitals,
  hrText,
  bpText,
  glucoseText,
  isHrWarning,
  isBpWarning,
  isGlucoseWarning,
  onVitalPress,
}: Props) {
  return (
    <View style={styles.elderlyCard}>
      <View style={styles.elderlyCardTopRow}>
        <View style={styles.elderlyAvatar}>
          <Ionicons name="body" color={Colors.primary} size={26} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.elderlyCardName}>
            <Text style={styles.elderlyCardLabelInline}>Người thân: </Text>
            {hasElderly ? elderlyName : 'Chưa liên kết'}
          </Text>
          {hasElderly && (
            <Text style={styles.elderlyCardUpdated}>
              {lastUpdatedLabel ? `Cập nhật: ${lastUpdatedLabel}` : 'Chưa có dữ liệu mới'}
            </Text>
          )}
        </View>
        {hasElderly && (
          <View style={styles.onlinePill}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: isRecentlyActive ? Colors.success : Colors.textHint },
              ]}
            />
            <Text style={styles.onlinePillText}>
              {isRecentlyActive ? 'Trực tuyến' : 'Ngoại tuyến'}
            </Text>
          </View>
        )}
      </View>
      {hasElderly && healthConditions.length > 0 && (
        <View style={styles.conditionsWrap}>
          {healthConditions.map((c, idx) => (
            <View key={`${c}-${idx}`} style={styles.conditionChip}>
              <Text style={styles.conditionChipText}>{c}</Text>
            </View>
          ))}
        </View>
      )}
      {showVitals && (
        <View style={styles.vitalsRow}>
          <VitalMiniCard
            label="Nhịp tim"
            value={hrText}
            isWarning={isHrWarning}
            onPress={onVitalPress}
          />
          <View style={{ width: 10 }} />
          <VitalMiniCard
            label="Huyết áp"
            value={bpText}
            isWarning={isBpWarning}
            onPress={onVitalPress}
          />
          <View style={{ width: 10 }} />
          <VitalMiniCard
            label="Đường"
            value={glucoseText}
            isWarning={isGlucoseWarning}
            onPress={onVitalPress}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  elderlyCard: {
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
  elderlyCardTopRow: { flexDirection: 'row', alignItems: 'center' },
  elderlyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: hexToRgba(Colors.primary, 0.12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  elderlyCardLabelInline: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  elderlyCardName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 2 },
  elderlyCardUpdated: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.35),
    backgroundColor: Colors.surface,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlinePillText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '600' },
  conditionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  conditionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: hexToRgba(Colors.primary, 0.1),
  },
  conditionChipText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  vitalsRow: { flexDirection: 'row', marginTop: 16 },
});
