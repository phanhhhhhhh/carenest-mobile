import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { getUserId } from '../../../core/storage/secureStorage';
import { useHealthMetricStore } from '../store/healthMetricStore';
import { useGoogleFitStore } from '../store/googleFitStore';
import { useHealthThresholdStore } from '../../family/store/healthThresholdStore';
import type { HealthMetric } from '../../../shared/types';
import {
  METRIC_CONFIGS,
  METRIC_KEYS,
  computeStatus,
  formatTime,
  type Status,
} from './elderlyHealth/metricConfig';
import { useAiInsight } from './elderlyHealth/useAiInsight';
import { AiInsightCard } from './elderlyHealth/AiInsightCard';
import { MetricSection } from './elderlyHealth/MetricSection';
import { PeriodChip, EmptyState } from './elderlyHealth/widgets';
import { AddMetricSheet, ValueDialog, GoogleFitSheet } from './elderlyHealth/modals';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyHealthScreen() {
  const navigation = useNavigation<Nav>();

  const [elderlyId, setElderlyId] = useState('');
  const [idLoaded, setIdLoaded] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [refreshing, setRefreshing] = useState(false);

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [valueDialog, setValueDialog] = useState<{
    type: string;
    label: string;
    unit: string;
  } | null>(null);
  const [valueInput, setValueInput] = useState('');
  const [fitSheetVisible, setFitSheetVisible] = useState(false);

  const healthStore = useHealthMetricStore(elderlyId);
  const healthIsLoading = healthStore((s) => s.isLoading);
  const healthError = healthStore((s) => s.error);
  const latestByTypeStore = healthStore((s) => s.latestByType);
  const healthMetrics = healthStore((s) => s.metrics);
  const findThresholdFor = useHealthThresholdStore((s) => s.findFor);
  const loadThresholds = useHealthThresholdStore((s) => s.load);

  const fitStore = useGoogleFitStore(elderlyId || 'unknown');

  useEffect(() => {
    (async () => {
      const id = await getUserId();
      setElderlyId(id ?? '');
      setIdLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!elderlyId) return;
    const controller = new AbortController();
    healthStore.getState().load(undefined, controller.signal);
    loadThresholds(elderlyId, controller.signal);
    fitStore.getState().loadStatus(controller.signal);
    return () => controller.abort();
  }, [elderlyId, healthStore, fitStore, loadThresholds]);

  const onRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await healthStore.getState().load();
    setRefreshing(false);
  };

  const getStatus = (data: HealthMetric): Status =>
    computeStatus(data, elderlyId, findThresholdFor);

  const ai = useAiInsight({ latestByType: latestByTypeStore, getStatus });

  const handlePeriodChange = (p: 'week' | 'month') => {
    setPeriod(p);
    if (elderlyId) healthStore.getState().loadPeriod(p);
  };

  const handleGoogleFit = async () => {
    if (!elderlyId) return;
    if (fitStore.getState().isConnected) {
      setFitSheetVisible(true);
    } else {
      const url = await fitStore.getState().connect();
      if (url) {
        try {
          await Linking.openURL(url);
        } catch {
          Alert.alert('Lỗi', 'Không thể mở trình duyệt');
        }
      }
    }
  };

  const handleFitSync = async () => {
    setFitSheetVisible(false);
    await fitStore.getState().syncNow();
    healthStore.getState().load();
  };

  const handleFitDisconnect = async () => {
    setFitSheetVisible(false);
    await fitStore.getState().disconnect();
  };

  const openValueDialog = (type: string) => {
    const config = METRIC_CONFIGS[type];
    setAddSheetVisible(false);
    setValueInput('');
    setValueDialog({ type, label: config.label, unit: config.unit });
  };

  const saveValue = async () => {
    if (!valueDialog) return;
    const trimmed = valueInput.trim();
    if (trimmed.length === 0) return;
    const ok = await healthStore
      .getState()
      .addMetric({ type: valueDialog.type, value: trimmed, unit: valueDialog.unit });
    if (ok) setValueDialog(null);
  };

  const hasLatest = Object.keys(latestByTypeStore).length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.appBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Chỉ số sức khỏe</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('HealthReport')}
          style={styles.reportBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="stats-chart" size={18} color={Colors.primary} />
          <Text style={styles.reportBtnText}>Báo cáo</Text>
        </TouchableOpacity>
      </View>

      {!idLoaded || (healthIsLoading && !hasLatest) ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải chỉ số sức khỏe...</Text>
        </View>
      ) : healthError && !hasLatest ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={54} color="#EF4444" />
          <Text style={styles.errorText}>{healthError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => healthStore.getState().load()}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Period Selector Chips */}
          <View style={styles.periodRow}>
            <PeriodChip
              label="7 ngày gần nhất"
              selected={period === 'week'}
              onPress={() => handlePeriodChange('week')}
            />
            <View style={{ width: 10 }} />
            <PeriodChip
              label="30 ngày qua"
              selected={period === 'month'}
              onPress={() => handlePeriodChange('month')}
            />
          </View>

          <View style={{ height: 16 }} />

          {/* AI Insight Card */}
          <AiInsightCard
            displayText={ai.displayText}
            aiLoading={ai.aiLoading}
            aiError={ai.aiError}
            showReload={ai.aiInsight != null}
            onReload={ai.reload}
          />

          <View style={{ height: 20 }} />

          {!hasLatest ? (
            <EmptyState />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Các chỉ số đo gần đây</Text>
              <View style={{ height: 12 }} />
              {METRIC_KEYS.map((key) => {
                const data = latestByTypeStore[key];
                const metricsForType = healthMetrics.filter((m) => m.type === key);
                return (
                  <MetricSection
                    key={key}
                    config={METRIC_CONFIGS[key]}
                    data={data}
                    status={data ? getStatus(data) : 'none'}
                    timeLabel={data ? formatTime(data.recordedAt) : ''}
                    metrics={metricsForType}
                  />
                );
              })}
            </>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {/* Senior-friendly Floating Action Button with label */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabFit}
          onPress={handleGoogleFit}
          activeOpacity={0.85}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="sync" size={20} color="#047857" />
          <Text style={styles.fabFitText}>Đồng hồ / Fit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabAdd}
          onPress={() => setAddSheetVisible(true)}
          activeOpacity={0.88}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.fabAddText}>Ghi nhận chỉ số</Text>
        </TouchableOpacity>
      </View>

      <AddMetricSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onPickMetric={openValueDialog}
      />

      <ValueDialog
        target={valueDialog}
        value={valueInput}
        onChangeValue={setValueInput}
        onCancel={() => setValueDialog(null)}
        onSave={saveValue}
      />

      <GoogleFitSheet
        visible={fitSheetVisible}
        onClose={() => setFitSheetVisible(false)}
        onSync={handleFitSync}
        onDisconnect={handleFitDisconnect}
      />
    </SafeAreaView>
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appBarTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  reportBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500' },
  errorText: { marginTop: 12, color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 18, paddingBottom: 110 },
  periodRow: { flexDirection: 'row' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

  fabContainer: {
    position: 'absolute',
    right: 18,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabFit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  fabFitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  fabAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 9999,
    gap: 6,
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabAddText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
