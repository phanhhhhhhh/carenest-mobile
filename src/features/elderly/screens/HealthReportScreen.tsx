import React, { useCallback, useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { getUserId } from '../../../core/storage/secureStorage';
import {
  useHealthReportStore,
  metricDisplayName,
  trendLabel,
  type MetricReportData,
  type MedicationAdherenceData,
} from '../store/healthReportStore';


export default function HealthReportScreen() {
  const navigation = useNavigation();
  const [elderlyId, setElderlyId] = useState('');

  const isLoading = useHealthReportStore((s) => s.isLoading);
  const error = useHealthReportStore((s) => s.error);
  const elderlyName = useHealthReportStore((s) => s.elderlyName);
  const fromDate = useHealthReportStore((s) => s.fromDate);
  const toDate = useHealthReportStore((s) => s.toDate);
  const metricReports = useHealthReportStore((s) => s.metricReports);
  const adherenceData = useHealthReportStore((s) => s.adherenceData);
  const totalAppointments = useHealthReportStore((s) => s.totalAppointments);
  const aiSummary = useHealthReportStore((s) => s.aiSummary);
  const load = useHealthReportStore((s) => s.load);

  const doLoad = useCallback(async () => {
    const id = await getUserId();
    if (id) {
      setElderlyId(id);
      load(id);
    }
  }, [load]);

  useEffect(() => {
    doLoad();
  }, [doLoad]);

  const dosesTaken = adherenceData.reduce((s, m) => s + m.taken, 0);

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
        <Text style={styles.appBarTitle}>Báo cáo sức khỏe</Text>
        {!isLoading && metricReports.length > 0 && (
          <TouchableOpacity onPress={() => load(elderlyId)} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error && metricReports.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="medkit-outline" size={56} color={Colors.textHint} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load(elderlyId)}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => load(elderlyId)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {elderlyName != null && (
            <SectionCard
              title={`Báo cáo của ${elderlyName}`}
              subtitle={fromDate && toDate ? `${fromDate} → ${toDate}` : '30 ngày gần đây'}
              icon="person"
              color={Colors.primary}
            />
          )}

          <View style={{ height: 12 }} />
          <View style={styles.statsRow}>
            <StatCard
              value={`${metricReports.length}`}
              label="Chỉ số theo dõi"
              icon="trending-up"
              color={Colors.primary}
            />
            <StatCard
              value={`${dosesTaken}`}
              label="Liều đã uống"
              icon="medkit"
              color={Colors.success}
            />
            <StatCard
              value={`${totalAppointments}`}
              label="Lịch hẹn"
              icon="calendar"
              color={Colors.secondary}
            />
          </View>

          {adherenceData.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Tuân thủ uống thuốc</Text>
              {adherenceData.map((m, i) => (
                <AdherenceCard key={`${m.medicationName}-${i}`} m={m} />
              ))}
            </>
          )}

          {metricReports.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Chỉ số sức khỏe</Text>
              {metricReports.map((r, i) => (
                <MetricCard key={`${r.type}-${i}`} report={r} />
              ))}
            </>
          )}

          {!!aiSummary && (
            <>
              <Text style={styles.sectionTitle}>Tóm tắt AI hàng tuần</Text>
              <AiSummaryCard summary={aiSummary} />
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  color,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={[styles.sectionIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.sectionCardTitle}>{title}</Text>
        <Text style={styles.sectionCardSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AdherenceCard({ m }: { m: MedicationAdherenceData }) {
  const rate = m.adherenceRate;
  const color = rate >= 0.8 ? Colors.success : rate >= 0.5 ? Colors.warning : Colors.error;
  return (
    <View style={[styles.adherenceCard, { borderColor: `${color}4D` }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.adherenceName}>{m.medicationName}</Text>
        <Text style={styles.adherenceDetail}>
          Đã uống: {m.taken}  •  Bỏ lỡ: {m.missed}
        </Text>
      </View>
      <View style={[styles.adherenceBadge, { backgroundColor: `${color}1A` }]}>
        <Text style={[styles.adherenceBadgeText, { color }]}>{Math.round(rate * 100)}%</Text>
      </View>
    </View>
  );
}

function MetricCard({ report }: { report: MetricReportData }) {
  let trendColor: string;
  switch (report.trend) {
    case 'INCREASING':
      trendColor = Colors.warning;
      break;
    case 'DECREASING':
      trendColor = Colors.primary;
      break;
    case 'STABLE':
      trendColor = Colors.success;
      break;
    default:
      trendColor = Colors.textHint;
  }

  const maxVal = report.maxValue ?? 1;

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeaderRow}>
        <Text style={styles.metricTitle} numberOfLines={1}>
          {metricDisplayName(report.type)}
        </Text>
        <View style={[styles.metricTrendBadge, { backgroundColor: `${trendColor}1A` }]}>
          <Text style={[styles.metricTrendText, { color: trendColor }]}>
            {trendLabel(report.trend)}
          </Text>
        </View>
      </View>

      {report.dataPoints.length > 0 && (
        <View style={styles.barChart}>
          {report.dataPoints.map((dp, i) => {
            const fraction = maxVal > 0 ? (dp.value ?? 0) / maxVal : 0;
            const height = Math.min(56, Math.max(4, fraction * 56));
            return (
              <View key={i} style={styles.barSlot}>
                <View style={[styles.bar, { height }]} />
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.metricStatsRow}>
        <MetricStat
          label="TB"
          value={`${report.avgValue !== undefined ? report.avgValue.toFixed(1) : '--'} ${report.unit}`}
        />
        <MetricStat label="Thấp nhất" value={`${report.minValue !== undefined ? report.minValue.toFixed(1) : '--'}`} />
        <MetricStat label="Cao nhất" value={`${report.maxValue !== undefined ? report.maxValue.toFixed(1) : '--'}`} />
        <View style={{ flex: 1 }} />
        <MetricStat label="Lượt đo" value={`${report.count}`} />
      </View>
    </View>
  );
}

function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginRight: 16 }}>
      <Text style={styles.metricStatLabel}>{label}</Text>
      <Text style={styles.metricStatValue}>{value}</Text>
    </View>
  );
}

function AiSummaryCard({ summary }: { summary: string }) {
  return (
    <View style={styles.aiCard}>
      <View style={styles.aiIconWrap}>
        <Ionicons name="sparkles" size={20} color={Colors.secondary} />
      </View>
      <Text style={styles.aiText}>{summary}</Text>
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
  backButton: { marginRight: 12 },
  appBarTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  refreshButton: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
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
  sectionCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: { fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  sectionCardSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  adherenceCard: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adherenceName: { fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  adherenceDetail: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  adherenceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  adherenceBadgeText: { fontWeight: '700', fontSize: 14 },
  metricCard: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  metricHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  metricTitle: { flex: 1, fontWeight: '700', fontSize: 15, color: Colors.textPrimary },
  metricTrendBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  metricTrendText: { fontSize: 11, fontWeight: '600' },
  barChart: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  barSlot: { flex: 1, marginHorizontal: 1, alignItems: 'stretch', justifyContent: 'flex-end' },
  bar: {
    backgroundColor: 'rgba(46, 125, 154, 0.6)',
    borderRadius: 3,
  },
  metricStatsRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  metricStatLabel: { color: Colors.textHint, fontSize: 10 },
  metricStatValue: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 },
  aiCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 130, 0.3)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  aiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 130, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: {
    flex: 1,
    marginLeft: 14,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19.5,
  },
});
