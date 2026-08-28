import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { getUserId } from '../../../core/storage/secureStorage';
import { useHealthReportStore } from '../store/healthReportStore';
import {
  SectionCard,
  StatCard,
  AdherenceCard,
  MetricCard,
  AiSummaryCard,
} from './healthReport/cards';

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
          <Image
            source={require('../../../../assets/mascot/mascot_dashboard.jpg')}
            style={styles.emptyMascot}
            resizeMode="contain"
          />
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

const styles = StyleSheet.create({
  emptyMascot: { width: 150, height: 150, marginBottom: 8 },
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
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
});
