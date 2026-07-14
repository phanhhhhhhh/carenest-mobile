import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useWeeklySummaryStore, getWeekLabel, type WeeklySummaryData } from '../store/weeklySummaryStore';

/**
 * Port of Flutter's weekly_summary_screen.dart (WeeklySummaryScreen).
 *
 * Notes on fidelity:
 * - Flutter read `elderlyId`/`elderlyName` off `familyDashboardProvider`.
 *   The RN equivalent is `useFamilyDashboardStore`'s `elderlyId()` /
 *   `elderlyName()` getters, matching the convention already used by
 *   HealthThresholdScreen.tsx / FamilyAlertsScreen.tsx.
 * - The Flutter FAB was a `FloatingActionButton.extended`; RN has no
 *   built-in FAB widget, so it is recreated with an absolutely-positioned
 *   pill-shaped TouchableOpacity, matching the style already used for the
 *   FAB in FamilyAppointmentsScreen.tsx.
 * - `ref.invalidate(weeklySummaryProvider(elderlyId))` (Flutter's Riverpod
 *   "retry" action, which re-runs the notifier's constructor -> `load()`)
 *   is ported as a direct call to `load(elderlyId)`.
 */

export default function WeeklySummaryScreen() {
  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyId = useFamilyDashboardStore((s) => s.elderlyId());
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName()) ?? 'Loved one';

  const isLoading = useWeeklySummaryStore((s) => s.isLoading);
  const error = useWeeklySummaryStore((s) => s.error);
  const summaries = useWeeklySummaryStore((s) => s.summaries);
  const load = useWeeklySummaryStore((s) => s.load);
  const generateNow = useWeeklySummaryStore((s) => s.generateNow);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (elderlyId) load(elderlyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId]);

  const handleRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  const handleGenerate = () => {
    if (!elderlyId) return;
    generateNow(elderlyId);
  };

  const renderAppBar = () => (
    <View style={styles.appBar}>
      <Text style={styles.appBarTitle} numberOfLines={1}>
        Weekly Report — {elderlyName}
      </Text>
    </View>
  );

  // No elderly linked yet
  if (!elderlyId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderAppBar()}
        <View style={styles.center}>
          <Ionicons name="people-outline" size={56} color={Colors.textHint} />
          <View style={{ height: 16 }} />
          <Text style={styles.noElderlyText}>No elderly person linked yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderAppBar()}

      <View style={{ flex: 1 }}>
        {isLoading && summaries.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error && summaries.length === 0 ? (
          renderError(error, () => load(elderlyId))
        ) : summaries.length === 0 ? (
          renderEmpty(handleGenerate)
        ) : (
          renderList(summaries, refreshing, handleRefresh)
        )}

        <TouchableOpacity
          style={styles.fab}
          disabled={isLoading}
          onPress={handleGenerate}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.fabText}>{isLoading ? 'Generating...' : 'Generate Now'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function renderError(error: string, onRetry: () => void) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
      <View style={{ height: 16 }} />
      <Text style={styles.errorText}>{error}</Text>
      <View style={{ height: 16 }} />
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color={Colors.surface} />
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

function renderEmpty(onGenerate: () => void) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="sparkles" color={Colors.primary} size={40} />
      </View>
      <View style={{ height: 16 }} />
      <Text style={styles.emptyTitle}>No weekly reports yet</Text>
      <View style={{ height: 6 }} />
      <Text style={styles.emptySubtitle}>
        AI-generated weekly health summaries{'\n'}will appear here
      </Text>
      <View style={{ height: 24 }} />
      <TouchableOpacity style={styles.generateBtn} onPress={onGenerate}>
        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        <Text style={styles.generateBtnText}>Generate First Report</Text>
      </TouchableOpacity>
    </View>
  );
}

function renderList(
  summaries: WeeklySummaryData[],
  refreshing: boolean,
  onRefresh: () => void,
) {
  return (
    <ScrollView
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
      }
    >
      {summaries.map((s, i) => (
        <SummaryCard key={s.id || i} summary={s} isLatest={i === 0} />
      ))}
    </ScrollView>
  );
}

function SummaryCard({ summary, isLatest }: { summary: WeeklySummaryData; isLatest: boolean }) {
  return (
    <View
      style={[
        styles.card,
        isLatest && { borderWidth: 1, borderColor: withAlpha(Colors.primary, 0.3) },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="sparkles" color="#FFFFFF" size={20} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{summary.title}</Text>
          <View style={{ height: 2 }} />
          <Text style={styles.cardWeekLabel}>{getWeekLabel(summary)}</Text>
        </View>
        {isLatest && (
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>Latest</Text>
          </View>
        )}
      </View>

      <View style={{ height: 14 }} />

      <View style={styles.statsRow}>
        <StatMini
          icon="medical"
          color={Colors.primary}
          value={`${summary.medicationAdherence}%`}
          label="Adherence"
        />
        <View style={{ width: 16 }} />
        <StatMini
          icon="pulse"
          color={Colors.secondary}
          value={`${summary.totalMetrics}`}
          label="Metrics"
        />
        <View style={{ width: 16 }} />
        <StatMini
          icon="warning"
          color={summary.abnormalMetrics > 0 ? Colors.error : Colors.success}
          value={`${summary.abnormalMetrics}`}
          label="Abnormal"
        />
      </View>

      <View style={{ height: 14 }} />
      <View style={styles.divider} />
      <View style={{ height: 10 }} />

      <Text style={styles.cardContent}>{summary.content}</Text>
    </View>
  );
}

function StatMini({
  icon,
  color,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statMiniRow}>
      <Ionicons name={icon} color={color} size={16} />
      <Text style={[styles.statMiniValue, { color }]}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  noElderlyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },

  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryBtnText: { color: Colors.surface, fontSize: 14, fontWeight: '600' },

  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: withAlpha(Colors.primary, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  list: { padding: 16, paddingBottom: 96 },
  card: {
    marginBottom: 14,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  cardWeekLabel: { color: Colors.textSecondary, fontSize: 12 },
  latestBadge: {
    backgroundColor: withAlpha(Colors.success, 0.1),
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  latestBadgeText: { color: Colors.success, fontSize: 11, fontWeight: '600' },

  statsRow: { flexDirection: 'row' },
  statMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statMiniValue: { fontSize: 15, fontWeight: '700' },
  statMiniLabel: { color: Colors.textHint, fontSize: 11 },

  divider: { height: 1, backgroundColor: Colors.divider },
  cardContent: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
