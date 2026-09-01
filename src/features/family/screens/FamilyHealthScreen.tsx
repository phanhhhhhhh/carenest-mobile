import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useHealthThresholdStore } from '../store/healthThresholdStore';
import { useHealthMetricStore } from '../../elderly/store/healthMetricStore';
import type { HealthMetric } from '../../../shared/types';
import { METRIC_ORDER, type Status } from './familyHealth/metricConfig';
import { MetricSection } from './familyHealth/MetricSection';
import { PeriodChip } from './familyHealth/widgets';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyHealthScreen() {
  const navigation = useNavigation<Nav>();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyId = useFamilyDashboardStore((s) => s.elderlyId());
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName()) ?? 'Người thân';

  useMountEffect(() => {
    if (dashboardData) return;
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{`Sức khỏe — ${elderlyName}`}</Text>
        <TouchableOpacity
          style={styles.appBarAction}
          onPress={() => navigation.navigate('HealthThreshold')}
        >
          <Ionicons name="options-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {elderlyId == null ? (
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>Chưa liên kết người thân nào</Text>
        </View>
      ) : (
        <HealthBody elderlyId={elderlyId} period={period} setPeriod={setPeriod} />
      )}
    </SafeAreaView>
  );
}

function HealthBody({
  elderlyId,
  period,
  setPeriod,
}: {
  elderlyId: string;
  period: 'week' | 'month';
  setPeriod: (p: 'week' | 'month') => void;
}) {
  const healthStore = useHealthMetricStore(elderlyId);
  const healthIsLoading = healthStore((s) => s.isLoading);
  const healthError = healthStore((s) => s.error);
  const latestByType = healthStore((s) => s.latestByType);
  const healthMetrics = healthStore((s) => s.metrics);
  const findFor = useHealthThresholdStore((s) => s.findFor);
  const loadThresholds = useHealthThresholdStore((s) => s.load);

  useEffect(() => {
    const controller = new AbortController();
    healthStore.getState().load(undefined, controller.signal);
    loadThresholds(elderlyId, controller.signal);
    return () => controller.abort();
    // `healthStore` is keyed by `elderlyId`, so it changes in lockstep with it.
  }, [elderlyId, healthStore, loadThresholds]);

  const deriveStatus = (type: string, metric: HealthMetric): Status => {
    const threshold = findFor(type);
    const val = Number.parseFloat(metric.value);

    if (threshold && !Number.isNaN(val)) {
      const minOk = threshold.minValue != null ? val >= threshold.minValue : true;
      const maxOk = threshold.maxValue != null ? val <= threshold.maxValue : true;
      if (minOk && maxOk) return { label: 'Bình thường', color: Colors.success };
      if (!minOk) return { label: 'Thấp', color: Colors.warning };
      if (!maxOk) return { label: 'Cao', color: Colors.error };
    }

    switch (type) {
      case 'BLOOD_PRESSURE':
        if (!Number.isNaN(val) && val < 130) return { label: 'Bình thường', color: Colors.success };
        if (!Number.isNaN(val) && val < 140) return { label: 'Hơi cao', color: Colors.warning };
        return { label: 'Cao', color: Colors.error };
      case 'BLOOD_GLUCOSE':
        if (!Number.isNaN(val) && val < 7.0) return { label: 'Bình thường', color: Colors.success };
        if (!Number.isNaN(val) && val < 11.1) return { label: 'Cao', color: Colors.warning };
        return { label: 'Rất cao', color: Colors.error };
      case 'HEART_RATE':
        if (!Number.isNaN(val) && val >= 60 && val <= 100) {
          return { label: 'Bình thường', color: Colors.success };
        }
        return { label: 'Bất thường', color: Colors.warning };
      default:
        return { label: 'Đã ghi nhận', color: Colors.success };
    }
  };

  const onSelectPeriod = (p: 'week' | 'month') => {
    setPeriod(p);
    healthStore.getState().loadPeriod(p);
  };

  if (healthIsLoading && Object.keys(latestByType).length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (healthError && Object.keys(latestByType).length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <View style={{ height: 16 }} />
        <Text style={styles.errorText}>{healthError}</Text>
        <View style={{ height: 16 }} />
        <TouchableOpacity style={styles.retryButton} onPress={() => healthStore.getState().load()}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (Object.keys(latestByType).length === 0) {
    return (
      <View style={styles.center}>
        <Image
          source={require('../../../../assets/mascot/mascot_confused.jpg')}
          style={{ width: 130, height: 130 }}
          resizeMode="contain"
        />
        <View style={{ height: 4 }} />
        <Text style={styles.emptyText}>Chưa có dữ liệu sức khỏe</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => healthStore.getState().load()}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.periodRow}>
        <PeriodChip
          label="7 ngày"
          selected={period === 'week'}
          onTap={() => onSelectPeriod('week')}
        />
        <View style={{ width: 8 }} />
        <PeriodChip
          label="30 ngày"
          selected={period === 'month'}
          onTap={() => onSelectPeriod('month')}
        />
      </View>
      <View style={{ height: 16 }} />

      {METRIC_ORDER.map((type) => {
        const latest = latestByType[type];
        if (!latest) return null;
        const all = healthMetrics.filter((m) => m.type === type);
        return (
          <View key={type}>
            <MetricSection
              type={type}
              latest={latest}
              all={all}
              status={deriveStatus(type, latest)}
            />
            <View style={{ height: 12 }} />
          </View>
        );
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  appBarAction: { padding: 4 },
  backButton: { marginRight: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  scroll: { padding: 16 },
  periodRow: { flexDirection: 'row' },
});
