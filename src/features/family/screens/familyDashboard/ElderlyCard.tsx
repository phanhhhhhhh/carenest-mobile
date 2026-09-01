import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
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
          <Ionicons name="person" color={Colors.primary} size={24} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.elderlyCardName}>
            {hasElderly ? elderlyName : 'Chưa liên kết người thân'}
          </Text>
          {hasElderly && (
            <Text style={styles.elderlyCardUpdated}>
              {lastUpdatedLabel ? `Cập nhật: ${lastUpdatedLabel}` : 'Chưa có dữ liệu mới'}
            </Text>
          )}
        </View>
        {hasElderly && (
          <View
            style={[
              styles.onlinePill,
              {
                backgroundColor: isRecentlyActive
                  ? Colors.successLight
                  : Colors.backgroundSecondary,
              },
            ]}
          >
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: isRecentlyActive ? Colors.success : Colors.textHint },
              ]}
            />
            <Text
              style={[
                styles.onlinePillText,
                { color: isRecentlyActive ? Colors.successDark : Colors.textSecondary },
              ]}
            >
              {isRecentlyActive ? 'Hoạt động' : 'Ngoại tuyến'}
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
            icon="heart"
            tintColor={Colors.heartRate}
          />
          <View style={{ width: 8 }} />
          <VitalMiniCard
            label="Huyết áp"
            value={bpText}
            isWarning={isBpWarning}
            onPress={onVitalPress}
            icon="pulse"
            tintColor={Colors.bloodPressure}
          />
          <View style={{ width: 8 }} />
          <VitalMiniCard
            label="Đường huyết"
            value={glucoseText}
            isWarning={isGlucoseWarning}
            onPress={onVitalPress}
            icon="water"
            tintColor={Colors.bloodGlucose}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  elderlyCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  elderlyCardTopRow: { flexDirection: 'row', alignItems: 'center' },
  elderlyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elderlyCardName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  elderlyCardUpdated: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlinePillText: { fontSize: 11.5, fontWeight: '700' },
  conditionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  conditionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.primaryLighter,
  },
  conditionChipText: { color: Colors.primary, fontSize: 11.5, fontWeight: '700' },
  vitalsRow: { flexDirection: 'row', marginTop: 16 },
});
