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
      Alert.alert('Thông báo', 'Hiện chưa có đề xuất mới.');
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.appBarTitle}>Ngưỡng cảnh báo y tế</Text>
            <Text style={styles.appBarSubtitle}>Người thân: {elderlyName}</Text>
          </View>
        </View>
        {elderlyId && (
          <TouchableOpacity
            style={styles.recommendBtn}
            onPress={handleRecommend}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={styles.recommendBtnText}>Đề xuất AI</Text>
          </TouchableOpacity>
        )}
      </View>

      {!elderlyId ? (
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={{ width: 140, height: 140, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>Chưa liên kết với người thân nào</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={22} color={Colors.primary} />
            <Text style={styles.infoBannerText}>
              Khi người thân đo chỉ số vượt ngoài các ngưỡng an toàn này, CareNest sẽ tự động gửi
              cảnh báo khẩn cấp đến điện thoại của bạn.
            </Text>
          </View>

          <View style={{ height: 16 }} />

          {isLoading && thresholds.length === 0 ? (
            <View style={styles.centerPad}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Đang tải cấu hình ngưỡng...</Text>
            </View>
          ) : (
            METRIC_TYPES.map((type) => {
              const item = findFor(type);
              return (
                <ThresholdCard
                  key={type}
                  type={type}
                  existing={item ?? null}
                  onPress={() => openEditSheet(type, item ?? null)}
                />
              );
            })
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      <ThresholdEditSheet
        key={sheetNonce}
        visible={sheetVisible}
        elderlyId={elderlyId}
        metricType={sheetMetricType}
        existing={sheetExisting}
        onClose={() => {
          setSheetVisible(false);
          if (elderlyId) load(elderlyId);
        }}
      />

      <RecommendDialog
        visible={recommendDialogVisible}
        onApply={applyAllRecommendations}
        onCancel={() => {
          setRecommendDialogVisible(false);
          clearRecommendations();
          setPendingRecs(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backBtn: {
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
  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  recommendBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 18 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E6F7F5',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#99E6E0',
  },
  infoBannerText: { flex: 1, fontSize: 13.5, color: '#0F172A', lineHeight: 20, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  centerPad: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  emptyText: { color: '#0F172A', fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
