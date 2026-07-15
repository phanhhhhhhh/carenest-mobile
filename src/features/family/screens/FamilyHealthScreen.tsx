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



const METRIC_ORDER = ['BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'HEART_RATE', 'WEIGHT'] as const;

interface MetricDef {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  unit: string;
}

const METRIC_DEFS: Record<string, MetricDef> = {
  BLOOD_PRESSURE: { title: 'Blood Pressure', icon: 'heart', color: Colors.error, unit: 'mmHg' },
  BLOOD_GLUCOSE: { title: 'Blood Sugar', icon: 'water', color: '#1565C0', unit: 'mmol/L' },
  HEART_RATE: { title: 'Heart Rate', icon: 'pulse', color: Colors.secondary, unit: 'bpm' },
  WEIGHT: { title: 'Weight', icon: 'speedometer', color: Colors.warning, unit: 'kg' },
};

interface Status {
  label: string;
  color: string;
}

function formatTime(iso: string): string {
  const dt = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()) /
    86400000,
  );

  if (diffMin < 1) return 'Just now';
  if (diffHours < 1) return `${diffMin}m ago`;
  if (diffDays === 0) return `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 1) return 'Yesterday';
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyHealthScreen() {
  const navigation = useNavigation<Nav>();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyId = useFamilyDashboardStore((s) => s.elderlyId());
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName()) ?? 'Loved one';

  useEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{`Health — ${elderlyName}`}</Text>
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
          <Text style={styles.emptyText}>No elderly person linked yet</Text>
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
    healthStore.getState().load();
    loadThresholds(elderlyId);
  }, [elderlyId]);

  const deriveStatus = (type: string, metric: HealthMetric): Status => {
    const threshold = findFor(type);
    const val = Number.parseFloat(metric.value);

    if (threshold && !Number.isNaN(val)) {
      const minOk = threshold.minValue != null ? val >= threshold.minValue : true;
      const maxOk = threshold.maxValue != null ? val <= threshold.maxValue : true;
      if (minOk && maxOk) return { label: 'Normal', color: Colors.success };
      if (!minOk) return { label: 'Low', color: Colors.warning };
      if (!maxOk) return { label: 'High', color: Colors.error };
    }

    switch (type) {
      case 'BLOOD_PRESSURE':
        if (!Number.isNaN(val) && val < 130) return { label: 'Normal', color: Colors.success };
        if (!Number.isNaN(val) && val < 140) return { label: 'Slightly High', color: Colors.warning };
        return { label: 'High', color: Colors.error };
      case 'BLOOD_GLUCOSE':
        if (!Number.isNaN(val) && val < 7.0) return { label: 'Normal', color: Colors.success };
        if (!Number.isNaN(val) && val < 11.1) return { label: 'High', color: Colors.warning };
        return { label: 'Very High', color: Colors.error };
      case 'HEART_RATE':
        if (!Number.isNaN(val) && val >= 60 && val <= 100) {
          return { label: 'Normal', color: Colors.success };
        }
        return { label: 'Abnormal', color: Colors.warning };
      default:
        return { label: 'Recorded', color: Colors.success };
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
          <Text style={styles.retryButtonText}>Retry</Text>
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
        <Text style={styles.emptyText}>No health data yet</Text>
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
        <PeriodChip label="7 days" selected={period === 'week'} onTap={() => onSelectPeriod('week')} />
        <View style={{ width: 8 }} />
        <PeriodChip label="30 days" selected={period === 'month'} onTap={() => onSelectPeriod('month')} />
      </View>
      <View style={{ height: 16 }} />

      {METRIC_ORDER.map((type) => {
        const latest = latestByType[type];
        if (!latest) return null;
        const all = healthMetrics.filter((m) => m.type === type);
        return (
          <View key={type}>
            <MetricSection type={type} latest={latest} all={all} status={deriveStatus(type, latest)} />
            <View style={{ height: 12 }} />
          </View>
        );
      })}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function PeriodChip({
  label,
  selected,
  onTap,
}: {
  label: string;
  selected: boolean;
  onTap: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onTap}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MetricSection({
  type,
  latest,
  all,
  status,
}: {
  type: string;
  latest: HealthMetric;
  all: HealthMetric[];
  status: Status;
}) {
  const def = METRIC_DEFS[type];
  const displayValue =
    type === 'BLOOD_PRESSURE' && latest.valueSecondary != null
      ? `${latest.value}/${latest.valueSecondary}`
      : latest.value;
  const unitLabel = latest.unit || def.unit;
  const timeLabel = formatTime(latest.recordedAt);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${def.color}1A` }]}>
          <Ionicons name={def.icon} size={22} color={def.color} />
        </View>
        <Text style={styles.cardTitle}>{def.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}1A` }]}>
          <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{displayValue}</Text>
        <Text style={styles.unitText}>{unitLabel}</Text>
        {timeLabel.length > 0 && <Text style={styles.timeText}>{`• ${timeLabel}`}</Text>}
      </View>

      <View style={{ height: 14 }} />

      <MiniChart metrics={all} color={def.color} />
    </View>
  );
}

function MiniChart({ metrics, color }: { metrics: HealthMetric[]; color: string }) {
  if (metrics.length < 2) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>Need more data</Text>
      </View>
    );
  }

  const sorted = [...metrics].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const values = sorted.map((m) => Number.parseFloat(m.value) || 0);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = Math.max(maxVal - minVal, 1);

  return (
    <View style={styles.chart}>
      {values.map((v, i) => {
        const fraction = (v - minVal) / range;
        const height = Math.min(50, Math.max(4, 6 + fraction * 44));
        return (
          <View key={i} style={styles.chartBarSlot}>
            <View style={[styles.chartBar, { height, backgroundColor: color }]} />
          </View>
        );
      })}
    </View>
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
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipUnselected: { backgroundColor: Colors.surface, borderColor: 'rgba(173, 181, 189, 0.3)' },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextSelected: { color: '#FFFFFF' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  valueText: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  unitText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 6, marginBottom: 4 },
  timeText: { fontSize: 12, color: Colors.textHint, marginLeft: 10, marginBottom: 4 },
  chartEmpty: {
    height: 50,
    backgroundColor: Colors.background,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: { color: Colors.textHint, fontSize: 12 },
  chart: { height: 50, flexDirection: 'row', alignItems: 'flex-end' },
  chartBarSlot: { flex: 1, marginHorizontal: 1, alignItems: 'stretch', justifyContent: 'flex-end' },
  chartBar: { borderRadius: 3 },
});
