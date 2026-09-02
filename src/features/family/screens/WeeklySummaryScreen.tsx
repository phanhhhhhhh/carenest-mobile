import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { showErrorToast } from '../../../shared/components/toastStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useWeeklySummaryStore } from '../store/weeklySummaryStore';
import { ErrorState, EmptyState, SummaryList } from './weeklySummary/states';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function WeeklySummaryScreen() {
  const navigation = useNavigation();
  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyId = useFamilyDashboardStore((s) => s.elderlyId());
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName()) ?? 'Người thân';

  const isLoading = useWeeklySummaryStore((s) => s.isLoading);
  const error = useWeeklySummaryStore((s) => s.error);
  const summaries = useWeeklySummaryStore((s) => s.summaries);
  const load = useWeeklySummaryStore((s) => s.load);
  const generateNow = useWeeklySummaryStore((s) => s.generateNow);

  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
  });

  useEffect(() => {
    if (elderlyId) load(elderlyId);
  }, [elderlyId, load]);

  const handleRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  const handleGenerate = async () => {
    if (!elderlyId) return;
    const result = await generateNow(elderlyId);
    if (!result) {
      showErrorToast(useWeeklySummaryStore.getState().error ?? 'Không thể tạo báo cáo hàng tuần');
    }
  };

  const renderAppBar = () => (
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
          <Text style={styles.appBarTitle} numberOfLines={1}>
            Báo cáo AI hàng tuần
          </Text>
          <Text style={styles.appBarSubtitle}>Người thân: {elderlyName}</Text>
        </View>
      </View>
    </View>
  );

  if (!elderlyId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderAppBar()}
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={{ width: 140, height: 140, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.noElderlyText}>Chưa liên kết với người cao tuổi nào</Text>
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
            <Text style={styles.loadingText}>Đang tổng hợp báo cáo AI...</Text>
          </View>
        ) : error && summaries.length === 0 ? (
          <ErrorState error={error} onRetry={() => load(elderlyId)} />
        ) : summaries.length === 0 ? (
          <EmptyState onGenerate={handleGenerate} />
        ) : (
          <SummaryList summaries={summaries} refreshing={refreshing} onRefresh={handleRefresh} />
        )}

        <TouchableOpacity
          style={styles.fab}
          disabled={isLoading}
          onPress={handleGenerate}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.fabText}>
            {isLoading ? 'Đang phân tích...' : 'Tạo báo cáo tuần mới'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
  noElderlyText: { color: '#0F172A', fontSize: 16.5, fontWeight: '700', textAlign: 'center' },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 9999,
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
});
