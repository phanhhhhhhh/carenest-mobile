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
      {/* Top Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Báo cáo sức khỏe của Bác</Text>
        {!isLoading && metricReports.length > 0 && (
          <TouchableOpacity
            onPress={() => load(elderlyId)}
            style={styles.refreshButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tổng hợp báo cáo sức khỏe...</Text>
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
          showsVerticalScrollIndicator={false}
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
              title={`Tổng quan sức khỏe của Bác`}
              subtitle={
                fromDate && toDate ? `${fromDate} → ${toDate}` : 'Theo dõi 30 ngày gần nhất'
              }
              icon="person"
              color={Colors.primary}
            />
          )}

          <View style={{ height: 14 }} />
          <View style={styles.statsRow}>
            <StatCard
              value={`${metricReports.length}`}
              label="Chỉ số theo dõi"
              icon="trending-up"
              color={Colors.primary}
            />
            <StatCard value={`${dosesTaken}`} label="Liều đã uống" icon="medkit" color="#059669" />
            <StatCard
              value={`${totalAppointments}`}
              label="Lịch khám"
              icon="calendar"
              color="#0284C7"
            />
          </View>

          {adherenceData.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Tỷ lệ tuân thủ uống thuốc</Text>
              {adherenceData.map((m, i) => (
                <AdherenceCard key={`${m.medicationName}-${i}`} m={m} />
              ))}
            </>
          )}

          {metricReports.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Diễn biến các chỉ số đo</Text>
              {metricReports.map((r, i) => (
                <MetricCard key={`${r.type}-${i}`} report={r} />
              ))}
            </>
          )}

          {!!aiSummary && (
            <>
              <Text style={styles.sectionTitle}>Đánh giá y tế từ AI CareNest</Text>
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
  emptyMascot: { width: 160, height: 160, marginBottom: 12 },
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
  appBarTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14.5, color: '#64748B', fontWeight: '500' },
  errorText: {
    color: '#64748B',
    fontSize: 14.5,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 18 },
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 22,
    marginBottom: 12,
  },
});
