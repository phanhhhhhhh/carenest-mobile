import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { showErrorToast } from '../../../shared/components/toastStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import {
  useHealthThresholdStore,
  type ThresholdItem,
  type RecommendData,
} from '../store/healthThresholdStore';
import { METRIC_TYPES } from './healthThreshold/utils';
import { ThresholdCard } from './healthThreshold/ThresholdCard';
import { ThresholdEditSheet } from './healthThreshold/ThresholdEditSheet';
import { RecommendDialog } from './healthThreshold/RecommendDialog';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HealthThresholdScreen() {
  const navigation = useNavigation<Nav>();

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyId = useFamilyDashboardStore((s) => s.elderlyId());
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName()) ?? 'Người thân';

  const isLoading = useHealthThresholdStore((s) => s.isLoading);
  const isSaving = useHealthThresholdStore((s) => s.isSaving);
  const thresholds = useHealthThresholdStore((s) => s.thresholds);
  const load = useHealthThresholdStore((s) => s.load);
  const create = useHealthThresholdStore((s) => s.create);
  const update = useHealthThresholdStore((s) => s.update);
  const getRecommendations = useHealthThresholdStore((s) => s.getRecommendations);
  const clearRecommendations = useHealthThresholdStore((s) => s.clearRecommendations);
  const findFor = useHealthThresholdStore((s) => s.findFor);

  const [recommendDialogVisible, setRecommendDialogVisible] = useState(false);
  const [pendingRecs, setPendingRecs] = useState<RecommendData[] | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMetricType, setSheetMetricType] = useState<string>('BLOOD_PRESSURE');
  const [sheetExisting, setSheetExisting] = useState<ThresholdItem | null>(null);
  // Bumped on every open so ThresholdEditSheet remounts with fresh state.
  const [sheetNonce, setSheetNonce] = useState(0);

  useMountEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
  });

  useEffect(() => {
    if (elderlyId) {
      load(elderlyId);
    }
  }, [elderlyId, load]);

  const openEditSheet = (metricType: string, existing: ThresholdItem | null) => {
    setSheetMetricType(metricType);
    setSheetExisting(existing);
    setSheetNonce((n) => n + 1);
    setSheetVisible(true);
  };

  const handleRecommend = async () => {
    if (!elderlyId) return;
    const recs = await getRecommendations(elderlyId);
    if (recs != null && recs.length > 0) {
      setPendingRecs(recs);
      setRecommendDialogVisible(true);
    } else if (recs == null) {
      showErrorToast(useHealthThresholdStore.getState().error ?? 'Không thể lấy đề xuất');
    } else {
      Alert.alert('', 'Không có đề xuất nào');
    }
  };

  const applyAllRecommendations = async () => {
    if (!elderlyId || !pendingRecs) return;
    setRecommendDialogVisible(false);
    for (const r of pendingRecs) {
      const params = {
        minValue: r.minValue,
        maxValue: r.maxValue,
        minValueSecondary: r.minValueSecondary,
        maxValueSecondary: r.maxValueSecondary,
      };
      const existing = findFor(r.metricType);
      if (existing) {
        await update(elderlyId, existing.id, params);
      } else {
        await create(elderlyId, { metricType: r.metricType, ...params });
      }
    }
    clearRecommendations();
    setPendingRecs(null);
  };

  const renderAppBar = () => (
    <View style={styles.appBar}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.appBarTitle} numberOfLines={1}>
        Ngưỡng cảnh báo sức khỏe — {elderlyName}
      </Text>
      <View style={styles.backBtn} />
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
          <Text style={styles.emptyText}>Chưa liên kết với người cao tuổi nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderAppBar()}

      {isLoading && thresholds.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.recommendBanner}>
            <View style={styles.recommendIconWrap}>
              <Ionicons name="sparkles" size={20} color={Colors.success} />
            </View>
            <Text style={styles.recommendText}>
              AI có thể phân tích hồ sơ sức khỏe và đề xuất ngưỡng cảnh báo phù hợp cho từng chỉ số.
            </Text>
            <TouchableOpacity
              style={styles.recommendBtn}
              disabled={isSaving}
              onPress={handleRecommend}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.recommendBtnText}>Đề xuất</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />

          <Text style={styles.sectionTitle}>Ngưỡng cảnh báo</Text>
          <View style={{ height: 4 }} />
          <Text style={styles.sectionSubtitle}>
            Đặt giới hạn cá nhân — AI sẽ cảnh báo khi vượt ngưỡng
          </Text>
          <View style={{ height: 16 }} />

          {METRIC_TYPES.map((type) => {
            const existing = findFor(type);
            return (
              <ThresholdCard
                key={type}
                type={type}
                existing={existing}
                onPress={() => openEditSheet(type, existing)}
              />
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <ThresholdEditSheet
        key={sheetNonce}
        visible={sheetVisible}
        metricType={sheetMetricType}
        existing={sheetExisting}
        elderlyId={elderlyId}
        onClose={() => setSheetVisible(false)}
      />

      <RecommendDialog
        visible={recommendDialogVisible}
        onCancel={() => setRecommendDialogVisible(false)}
        onApply={applyAllRecommendations}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  scroll: { padding: 16 },
  recommendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EEF6EA',
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.2)',
  },
  recommendIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(67, 160, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendText: {
    flex: 1,
    marginLeft: 12,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  recommendBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 13 },
});
