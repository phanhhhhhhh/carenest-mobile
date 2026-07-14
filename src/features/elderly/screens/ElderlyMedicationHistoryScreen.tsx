import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useMedicationStore } from '../store/medicationStore';
import type { MedicationLogEntry } from '../../../shared/types';

// TODO(routing): 'ElderlyMedicationHistory' route + params
// { medicationId: string; medicationName: string } needs to be registered in
// RootStackParamList by the navigation owner. Using a loose route type here
// until that lands.
type HistoryRouteParams = { medicationId: string; medicationName: string };

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDateLabel(dt: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  // JS getDay(): 0=Sun..6=Sat. Flutter weekday: 1=Mon..7=Sun.
  const jsDay = dt.getDay();
  const weekdayIdx = jsDay === 0 ? 6 : jsDay - 1;
  return `${WEEK_DAYS[weekdayIdx]}, ${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function ElderlyMedicationHistoryScreen() {
  const route = useRoute();
  const { medicationId, medicationName } = (route.params ?? {}) as HistoryRouteParams;

  const logs = useMedicationStore((s) => s.logs);
  const isLoadingStore = useMedicationStore((s) => s.isLoading);
  const logsError = useMedicationStore((s) => s.logsError);
  const fetchLogs = useMedicationStore((s) => s.fetchLogs);

  const isLoading = isLoadingStore && logs.length === 0;

  useEffect(() => {
    fetchLogs(medicationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicationId]);

  // Group logs by date (yyyy-MM-dd)
  const grouped: Record<string, MedicationLogEntry[]> = {};
  for (const log of logs) {
    const d = new Date(log.takenAt);
    const dateKey = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(log);
  }

  const taken = logs.filter((l) => l.status === 'TAKEN').length;
  const missed = logs.filter((l) => l.status === 'MISSED').length;
  const total = logs.length;
  const adherence = total === 0 ? 0 : taken / total;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle} numberOfLines={1}>
          History - {medicationName}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : logsError && logs.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" color={Colors.textHint} size={48} />
          <Text style={styles.errorText}>{logsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchLogs(medicationId)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" color={Colors.textHint} size={48} />
          <Text style={styles.emptyText}>No medication history yet</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => fetchLogs(medicationId)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Summary card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Adherence Overview</Text>
            <Text style={styles.summaryValue}>{Math.round(adherence * 100)}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${adherence * 100}%` }]} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={[styles.statPillText, { color: Colors.success }]}>
                  {taken} taken
                </Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="close-circle" size={16} color={Colors.error} />
                <Text style={[styles.statPillText, { color: Colors.error }]}>
                  {missed} missed
                </Text>
              </View>
            </View>
          </View>

          {/* Log entries grouped by date */}
          {Object.entries(grouped).map(([dateKey, dayLogs]) => {
            const parsed = new Date(dateKey);
            const dayLabel = formatDateLabel(parsed);
            return (
              <View key={dateKey}>
                <Text style={styles.dayLabel}>{dayLabel}</Text>
                {dayLogs.map((log) => (
                  <LogEntryTile key={log.id} log={log} />
                ))}
                <View style={{ height: 4 }} />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function LogEntryTile({ log }: { log: MedicationLogEntry }) {
  const isTaken = log.status === 'TAKEN';
  const d = new Date(log.takenAt);
  const timeStr = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  return (
    <View
      style={[
        styles.logTile,
        { borderColor: isTaken ? 'rgba(67, 160, 71, 0.2)' : 'rgba(229, 57, 53, 0.15)' },
      ]}
    >
      <View
        style={[
          styles.logIconWrap,
          { backgroundColor: isTaken ? 'rgba(67, 160, 71, 0.1)' : 'rgba(229, 57, 53, 0.08)' },
        ]}
      >
        <Ionicons
          name={isTaken ? 'checkmark' : 'close'}
          size={20}
          color={isTaken ? Colors.success : Colors.error}
        />
      </View>
      <Text
        style={[styles.logStatusText, { color: isTaken ? Colors.success : Colors.error }]}
      >
        {isTaken ? 'Taken' : 'Missed'}
      </Text>
      <View style={styles.logTimePill}>
        <Text style={styles.logTimeText}>{timeStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, marginTop: 12 },
  retryButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  scroll: { padding: 16 },
  summaryCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: Colors.primaryDark,
    marginBottom: 20,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  summaryValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginTop: 8 },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 6, backgroundColor: '#81D4FA' },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 12 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statPillText: { fontSize: 13, fontWeight: '600' },
  dayLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 4,
    marginBottom: 10,
    marginTop: 6,
  },
  logTile: {
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logStatusText: { flex: 1, fontWeight: '600', fontSize: 14 },
  logTimePill: {
    backgroundColor: 'rgba(46, 125, 154, 0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logTimeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
});
