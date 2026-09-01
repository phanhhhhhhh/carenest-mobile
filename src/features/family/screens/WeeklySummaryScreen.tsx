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
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.appBarTitle} numberOfLines={1}>
        Báo cáo hàng tuần — {elderlyName}
      </Text>
    </View>
  );

  if (!elderlyId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderAppBar()}
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={{ width: 140, height: 140 }}
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
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.fabText}>{isLoading ? 'Đang tạo...' : 'Tạo ngay'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12 },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  noElderlyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },
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
