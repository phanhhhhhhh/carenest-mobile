import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import { VitalMiniCard } from './widgets';
import { Alert } from '../../../../shared/utils/crossPlatformAlert';

interface Props {
  hasElderly: boolean;
  elderlyName: string;
  elderlyPhone?: string;
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
  elderlyPhone,
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
  const handleCall = () => {
    if (!elderlyPhone) {
      Alert.alert('Chưa có số điện thoại', 'Người thân chưa cập nhật số điện thoại.');
      return;
    }
    Linking.openURL(`tel:${elderlyPhone}`).catch(() => {
      Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
    });
  };

  return (
    <View style={styles.elderlyCard}>
      <View style={styles.elderlyCardTopRow}>
        <View style={styles.elderlyAvatar}>
          <Ionicons name="person" color={Colors.primary} size={26} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.elderlyCardName}>
              {hasElderly ? elderlyName : 'Chưa liên kết người thân'}
            </Text>
          </View>
          {hasElderly && (
            <Text style={styles.elderlyCardUpdated}>
              {lastUpdatedLabel ? `Cập nhật: ${lastUpdatedLabel}` : 'Chưa có dữ liệu mới'}
            </Text>
          )}
        </View>

        {hasElderly && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!!elderlyPhone && (
              <TouchableOpacity
                style={styles.quickCallBtn}
                onPress={handleCall}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View
              style={[
                styles.onlinePill,
                {
                  backgroundColor: isRecentlyActive ? '#DCFCE7' : '#F1F5F9',
                },
              ]}
            >
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: isRecentlyActive ? '#16A34A' : '#94A3B8' },
                ]}
              />
              <Text
                style={[styles.onlinePillText, { color: isRecentlyActive ? '#15803D' : '#64748B' }]}
              >
                {isRecentlyActive ? 'Hoạt động' : 'Ngoại tuyến'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {hasElderly && healthConditions.length > 0 && (
        <View style={styles.conditionsWrap}>
          {healthConditions.map((c, idx) => (
            <View key={`${c}-${idx}`} style={styles.conditionChip}>
              <Ionicons
                name="medkit-outline"
                size={12}
                color={Colors.primary}
                style={{ marginRight: 4 }}
              />
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
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  elderlyCardTopRow: { flexDirection: 'row', alignItems: 'center' },
  elderlyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#99E6E0',
  },
  elderlyCardName: { color: '#0F172A', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  elderlyCardUpdated: { color: '#64748B', fontSize: 12.5, marginTop: 2, fontWeight: '500' },
  quickCallBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlinePillText: { fontSize: 12, fontWeight: '700' },
  conditionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#E6F7F5',
    borderWidth: 1,
    borderColor: '#CCF0ED',
  },
  conditionChipText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  vitalsRow: { flexDirection: 'row', marginTop: 16 },
});
