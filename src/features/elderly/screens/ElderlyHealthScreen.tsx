import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
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
    // Re-run only when the resolved elderlyId changes; the stores are keyed by it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId]);

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
      <View style={styles.appBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Chỉ số sức khỏe</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('HealthReport')}>
          <Ionicons name="stats-chart" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {!idLoaded || (healthIsLoading && !hasLatest) ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : healthError && !hasLatest ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textHint} />
          <Text style={styles.errorText}>{healthError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => healthStore.getState().load()}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.periodRow}>
            <PeriodChip
              label="7 ngày"
              selected={period === 'week'}
              onPress={() => handlePeriodChange('week')}
            />
            <View style={{ width: 8 }} />
            <PeriodChip
              label="30 ngày"
              selected={period === 'month'}
              onPress={() => handlePeriodChange('month')}
            />
          </View>

          <View style={{ height: 16 }} />

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
              <Text style={styles.sectionTitle}>Chỉ số mới nhất</Text>
              <View style={{ height: 14 }} />
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

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <View style={styles.fabColumn}>
        <TouchableOpacity style={styles.fabSmall} onPress={handleGoogleFit}>
          <Ionicons name="sync" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ height: 12 }} />
        <TouchableOpacity style={styles.fabLarge} onPress={() => setAddSheetVisible(true)}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
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
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 100 },
  periodRow: { flexDirection: 'row' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  fabColumn: { position: 'absolute', right: 20, bottom: 24, alignItems: 'center' },
  fabSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  fabLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});
