import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { getUserId } from '../../../core/storage/secureStorage';
import { GeminiService } from '../../../core/services/geminiService';
import { useHealthMetricStore } from '../store/healthMetricStore';
import { useGoogleFitStore } from '../store/googleFitStore';
import { useHealthThresholdStore } from '../../family/store/healthThresholdStore';
import type { HealthMetric } from '../../../shared/types';



type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MetricConfig {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bgColor: string;
  unit: string;
  normalRange?: [number, number];
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  BLOOD_PRESSURE: {
    label: 'Blood Pressure',
    icon: 'heart',
    color: Colors.error,
    bgColor: '#FFEBEE',
    unit: 'mmHg',
    normalRange: [90, 140],
  },
  BLOOD_GLUCOSE: {
    label: 'Blood Sugar',
    icon: 'water',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    unit: 'mmol/L',
    normalRange: [3.9, 6.7],
  },
  HEART_RATE: {
    label: 'Heart Rate',
    icon: 'pulse',
    color: Colors.secondary,
    bgColor: '#E8F5E9',
    unit: 'bpm',
    normalRange: [60, 100],
  },
  WEIGHT: {
    label: 'Weight',
    icon: 'barbell',
    color: Colors.warning,
    bgColor: '#FFF3E0',
    unit: 'kg',
  },
};

const METRIC_KEYS = Object.keys(METRIC_CONFIGS);

function formatTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffHours < 1) return `${diffMinutes}m ago`;
  if (diffDays === 0) {
    const h = String(dt.getHours()).padStart(2, '0');
    const m = String(dt.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

type Status = 'high' | 'low' | 'normal' | 'none';

export default function ElderlyHealthScreen() {
  const navigation = useNavigation<Nav>();

  const [elderlyId, setElderlyId] = useState('');
  const [idLoaded, setIdLoaded] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [valueDialog, setValueDialog] = useState<{ type: string; label: string; unit: string } | null>(
    null,
  );
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
  }, [elderlyId]);

  const getStatus = (data: HealthMetric): Status => {
    if (elderlyId) {
      const threshold = findThresholdFor(data.type);
      if (threshold) {
        const val = Number.parseFloat(data.value);
        if (!Number.isNaN(val)) {
          if (threshold.minValue != null && val < threshold.minValue) return 'low';
          if (threshold.maxValue != null && val > threshold.maxValue) return 'high';
          return 'normal';
        }
      }
    }
    const config = METRIC_CONFIGS[data.type];
    if (!config || !config.normalRange) return 'normal';
    const val = Number.parseFloat(data.value);
    if (Number.isNaN(val)) return 'normal';
    if (val > config.normalRange[1]) return 'high';
    if (val < config.normalRange[0]) return 'low';
    return 'normal';
  };

  const ruleBasedInsight = (): string => {
    const entries = Object.entries(latestByTypeStore);
    const abnormal = entries.filter(([, v]) => getStatus(v) !== 'normal');
    if (abnormal.length === 0) {
      return 'All your readings today are within normal range. Keep up the healthy lifestyle!';
    }
    const names = abnormal.map(([k]) => METRIC_CONFIGS[k]?.label ?? k).join(', ');
    return `Note: ${names} are outside normal range. Monitor closely and consult your doctor if it persists.`;
  };

  const buildHealthPrompt = (): string => {
    const lines: string[] = [
      'Briefly analyze the following health metrics for an elderly person (reply in English, max 3-4 sentences, friendly tone like a care assistant):',
    ];
    for (const [type, data] of Object.entries(latestByTypeStore)) {
      const config = METRIC_CONFIGS[type];
      if (config) {
        const display = data.valueSecondary ? `${data.value}/${data.valueSecondary}` : data.value;
        const dt = new Date(data.recordedAt);
        const timeStr = Number.isNaN(dt.getTime())
          ? ''
          : `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
        lines.push(`- ${config.label}: ${display} ${config.unit} (at ${timeStr})`);
      }
    }
    lines.push('Evaluate each metric, flag any abnormalities, and give one short piece of advice.');
    return lines.join('\n');
  };

  const loadAiInsight = async () => {
    if (Object.keys(latestByTypeStore).length === 0) {
      setAiInsight(
        'Start tracking your health by adding your first reading. ' +
        'I will help you analyze trends and provide personalized advice!',
      );
      setAiLoading(false);
      setAiError(null);
      return;
    }

    if (aiLoading) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const prompt = buildHealthPrompt();
      const gemini = new GeminiService();
      const reply = await gemini.sendMessage(prompt);
      setAiInsight(reply);
      setAiLoading(false);
    } catch {
      setAiInsight(ruleBasedInsight());
      setAiLoading(false);
      setAiError('Cannot connect to AI, showing basic analysis');
    }
  };

  useEffect(() => {
    if (!aiLoading && aiInsight == null && Object.keys(latestByTypeStore).length > 0) {
      loadAiInsight();
    }
  }, [latestByTypeStore]);

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
          Alert.alert('Error', 'Could not open browser');
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
    const ok = await healthStore.getState().addMetric({ type: valueDialog.type, value: trimmed, unit: valueDialog.unit });
    if (ok) setValueDialog(null);
  };

  const displayText = aiInsight ?? ruleBasedInsight();
  const hasLatest = Object.keys(latestByTypeStore).length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Health Metrics</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={() => healthStore.getState().load()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.periodRow}>
            <PeriodChip label="7 days" selected={period === 'week'} onPress={() => handlePeriodChange('week')} />
            <View style={{ width: 8 }} />
            <PeriodChip label="30 days" selected={period === 'month'} onPress={() => handlePeriodChange('month')} />
          </View>

          <View style={{ height: 16 }} />

          <View style={styles.aiCard}>
            <View style={styles.aiRow}>
              <View
                style={[
                  styles.aiIconWrap,
                  { backgroundColor: aiLoading ? 'rgba(255, 167, 38, 0.15)' : 'rgba(67, 160, 71, 0.15)' },
                ]}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color={Colors.warning} />
                ) : (
                  <Ionicons name="sparkles" size={20} color={Colors.success} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.aiTitle}>AI Insight</Text>
                  {aiLoading && <Text style={styles.aiAnalyzing}>  analyzing...</Text>}
                </View>
                <Text style={styles.aiText}>{displayText}</Text>
              </View>
              {!aiLoading && aiInsight != null && (
                <TouchableOpacity onPress={loadAiInsight} style={{ padding: 4 }}>
                  <Ionicons name="refresh" size={18} color={Colors.textHint} />
                </TouchableOpacity>
              )}
            </View>
            {!!aiError && <Text style={styles.aiError}>{aiError}</Text>}
          </View>

          <View style={{ height: 20 }} />

          {!hasLatest ? (
            <EmptyState />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Latest Readings</Text>
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

      <Modal
        visible={addSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayBottom}
          activeOpacity={1}
          onPress={() => setAddSheetVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add health metric</Text>
            <View style={{ height: 12 }} />
            {METRIC_KEYS.map((key) => {
              const config = METRIC_CONFIGS[key];
              return (
                <TouchableOpacity key={key} style={styles.sheetItem} onPress={() => openValueDialog(key)}>
                  <View style={[styles.sheetItemIcon, { backgroundColor: config.bgColor }]}>
                    <Ionicons name={config.icon} size={22} color={config.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.sheetItemLabel}>{config.label}</Text>
                    <Text style={styles.sheetItemUnit}>Unit: {config.unit}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={valueDialog != null}
        transparent
        animationType="fade"
        onRequestClose={() => setValueDialog(null)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Enter {valueDialog?.label}</Text>
            <View style={{ height: 12 }} />
            <TextInput
              style={styles.dialogInput}
              placeholder={`Value (${valueDialog?.unit})`}
              placeholderTextColor={Colors.textHint}
              keyboardType="numeric"
              autoFocus
              value={valueInput}
              onChangeText={setValueInput}
            />
            <View style={{ height: 16 }} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setValueDialog(null)} style={styles.dialogCancelBtn}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity onPress={saveValue} style={styles.dialogSaveBtn}>
                <Text style={styles.dialogSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={fitSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFitSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayBottom}
          activeOpacity={1}
          onPress={() => setFitSheetVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.sheetItem} onPress={handleFitSync}>
              <Ionicons name="sync" size={22} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.sheetItemLabel}>Sync Now</Text>
                <Text style={styles.sheetItemUnit}>Pull latest data from Google Fit</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleFitDisconnect}>
              <Ionicons name="link" size={22} color={Colors.error} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.sheetItemLabel}>Disconnect</Text>
                <Text style={styles.sheetItemUnit}>Stop syncing with Google Fit</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function PeriodChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.periodChip,
        {
          backgroundColor: selected ? Colors.primary : Colors.surface,
          borderColor: selected ? Colors.primary : 'rgba(173, 181, 189, 0.3)',
        },
      ]}
    >
      <Text style={[styles.periodChipText, { color: selected ? '#FFFFFF' : Colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Image
        source={require('../../../../assets/mascot/mascot_confused.jpg')}
        style={{ width: 130, height: 130 }}
        resizeMode="contain"
      />
      <View style={{ height: 4 }} />
      <Text style={styles.emptyTitle}>No health data yet</Text>
      <View style={{ height: 6 }} />
      <Text style={styles.emptySubtitle}>Press + to add your first reading</Text>
    </View>
  );
}

function statusLabel(status: Status): string {
  switch (status) {
    case 'high':
      return 'High';
    case 'low':
      return 'Low';
    case 'normal':
      return 'Normal';
    default:
      return '';
  }
}

function statusColor(status: Status): string {
  switch (status) {
    case 'high':
      return Colors.error;
    case 'low':
      return Colors.warning;
    case 'normal':
      return Colors.success;
    default:
      return Colors.textHint;
  }
}

function MetricSection({
  config,
  data,
  status,
  timeLabel,
  metrics,
}: {
  config: MetricConfig;
  data?: HealthMetric;
  status: Status;
  timeLabel: string;
  metrics: HealthMetric[];
}) {
  const displayValue = data
    ? data.type === 'BLOOD_PRESSURE' && data.valueSecondary
      ? `${data.value}/${data.valueSecondary}`
      : data.value
    : '--';

  const sorted = useMemo(
    () => [...metrics].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [metrics],
  );
  const values = sorted.map((m) => Number.parseFloat(m.value) || 0);
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const range = Math.max(maxVal - minVal, 1);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeaderRow}>
        <View style={[styles.metricIconWrap, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <Text style={styles.metricTitle}>{config.label}</Text>
        {status !== 'none' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor(status)}1A`, borderColor: `${statusColor(status)}4D` },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor(status) }]}>{statusLabel(status)}</Text>
          </View>
        )}
        <View style={{ width: 8 }} />
        <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
      </View>

      <View style={{ height: 16 }} />

      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{displayValue}</Text>
        <Text style={styles.metricUnit}>  {config.unit}</Text>
        {!!timeLabel && <Text style={styles.metricTime}>  • {timeLabel}</Text>}
      </View>

      <View style={{ height: 14 }} />

      {values.length < 2 ? (
        <View style={styles.miniChartEmpty}>
          <Text style={styles.miniChartEmptyText}>Need more data to show chart</Text>
        </View>
      ) : (
        <View style={styles.miniChart}>
          {values.map((v, i) => {
            const fraction = range > 0 ? (v - minVal) / range : 0;
            const height = Math.min(50, Math.max(4, fraction * 46 + 4));
            return (
              <View key={i} style={styles.miniBarSlot}>
                <View style={[styles.miniBar, { height, backgroundColor: config.color }]} />
              </View>
            );
          })}
        </View>
      )}
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
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  periodChipText: { fontSize: 13, fontWeight: '600' },

  aiCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EFF7EF',
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.2)',
  },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start' },
  aiIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  aiAnalyzing: { color: Colors.textSecondary, fontSize: 11, fontStyle: 'italic' },
  aiText: { marginTop: 4, color: Colors.textSecondary, fontSize: 13, lineHeight: 19.5 },
  aiError: { marginTop: 8, color: Colors.warning, fontSize: 11, fontStyle: 'italic' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  emptyState: { paddingVertical: 48, alignItems: 'center' },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14 },

  metricCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  metricHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  metricIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricTitle: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '600' },
  metricValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  metricValue: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  metricUnit: { fontSize: 14, color: Colors.textSecondary },
  metricTime: { fontSize: 12, color: Colors.textHint },

  miniChartEmpty: {
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChartEmptyText: { color: Colors.textHint, fontSize: 12 },
  miniChart: { height: 50, flexDirection: 'row', alignItems: 'flex-end' },
  miniBarSlot: { flex: 1, marginHorizontal: 1, justifyContent: 'flex-end' },
  miniBar: { borderRadius: 3 },

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

  modalOverlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textHint,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sheetItemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetItemLabel: { fontWeight: '600', color: Colors.textPrimary, fontSize: 15 },
  sheetItemUnit: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  dialogCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  dialogInput: {
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  dialogCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  dialogCancelText: { color: Colors.textSecondary, fontWeight: '600' },
  dialogSaveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  dialogSaveText: { color: '#FFFFFF', fontWeight: '600' },
});
