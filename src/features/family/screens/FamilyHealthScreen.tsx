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
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.appBarTitle}>Chỉ số sức khỏe</Text>
            <Text style={styles.appBarSubtitle}>Người thân: {elderlyName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.thresholdBtn}
          onPress={() => navigation.navigate('HealthThreshold')}
          activeOpacity={0.8}
        >
          <Ionicons name="options" size={18} color={Colors.primary} />
          <Text style={styles.thresholdBtnText}>Cài ngưỡng</Text>
        </TouchableOpacity>
      </View>

      {elderlyId == null ? (
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={{ width: 140, height: 140, marginBottom: 8 }}
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
  }, [elderlyId, healthStore, loadThresholds]);

  const deriveStatus = (type: string, metric: HealthMetric): Status => {
    const threshold = findFor(type);
    const val = Number.parseFloat(metric.value);

    if (threshold && !Number.isNaN(val)) {
      const minOk = threshold.minValue != null ? val >= threshold.minValue : true;
      const maxOk = threshold.maxValue != null ? val <= threshold.maxValue : true;
      if (minOk && maxOk) return { label: 'Bình thường', color: '#15803D' };
      if (!minOk) return { label: 'Thấp', color: '#D97706' };
      if (!maxOk) return { label: 'Cao', color: '#DC2626' };
    }

    switch (type) {
      case 'BLOOD_PRESSURE':
        if (!Number.isNaN(val) && val < 130) return { label: 'Bình thường', color: '#15803D' };
        if (!Number.isNaN(val) && val < 140) return { label: 'Hơi cao', color: '#D97706' };
        return { label: 'Cao', color: '#DC2626' };
      case 'BLOOD_GLUCOSE':
        if (!Number.isNaN(val) && val < 7.0) return { label: 'Bình thường', color: '#15803D' };
        if (!Number.isNaN(val) && val < 11.1) return { label: 'Cao', color: '#D97706' };
        return { label: 'Rất cao', color: '#DC2626' };
      case 'HEART_RATE':
        if (!Number.isNaN(val) && val >= 60 && val <= 100) {
          return { label: 'Bình thường', color: '#15803D' };
        }
        return { label: 'Bất thường', color: '#D97706' };
      default:
        return { label: 'Đã ghi nhận', color: '#15803D' };
    }
  };

  const onSelectPeriod = (p: 'week' | 'month') => {
    setPeriod(p);
    healthStore.getState().loadPeriod(p);
  };

  if (healthIsLoading && Object.keys(latestByType).length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Đang tải chỉ số sức khỏe...</Text>
      </View>
    );
  }

  if (healthError && Object.keys(latestByType).length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
        <View style={{ height: 12 }} />
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
          style={{ width: 140, height: 140, marginBottom: 8 }}
          resizeMode="contain"
        />
        <Text style={styles.emptyText}>Chưa có dữ liệu đo sức khỏe</Text>
        <Text style={styles.emptySub}>
          Các chỉ số đo huyết áp, đường huyết, nhịp tim sẽ hiển thị ở đây.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
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
          label="7 ngày gần nhất"
          selected={period === 'week'}
          onTap={() => onSelectPeriod('week')}
        />
        <View style={{ width: 8 }} />
        <PeriodChip
          label="30 ngày qua"
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
            <View style={{ height: 14 }} />
          </View>
        );
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  appBarSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 1, fontWeight: '500' },
  thresholdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  thresholdBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { color: '#0F172A', fontSize: 16.5, fontWeight: '800', textAlign: 'center' },
  emptySub: { color: '#64748B', fontSize: 13.5, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
  scroll: { padding: 18 },
  periodRow: { flexDirection: 'row' },
});
