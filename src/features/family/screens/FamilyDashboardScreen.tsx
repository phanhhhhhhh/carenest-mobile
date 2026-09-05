import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { Shadows } from '../../../core/theme/spacing';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useCameraStore } from '../store/cameraStore';
import { useMedicationStore } from '../../elderly/store/medicationStore';
import {
  useNotificationStore,
  selectUnreadCount,
} from '../../notifications/store/notificationStore';
import { formatRelative } from './familyDashboard/utils';
import { ElderlyCard } from './familyDashboard/ElderlyCard';
import { TodayMedsCard } from './familyDashboard/TodayMedsCard';
import { DashboardCameraCard } from './familyDashboard/DashboardCameraCard';
import { TodayCheckinCard } from './familyDashboard/TodayCheckinCard';
import { FeedRow } from './familyFeed/FeedRow';
import { useCheckInStore, selectTodayCheckIn } from '../../elderly/store/checkinStore';
import { useFeedStore, selectFeed } from '../store/feedStore';
import { AppointmentPreviewCard } from './familyDashboard/widgets';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const dashData = useFamilyDashboardStore((s) => s.data);
  const dashLoading = useFamilyDashboardStore((s) => s.isLoading);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const selectElderly = useFamilyDashboardStore((s) => s.selectElderly);
  const refreshDashboard = useFamilyDashboardStore((s) => s.refresh);

  const medItems = useMedicationStore((s) => s.items);
  const medLoading = useMedicationStore((s) => s.isLoading);
  const loadMeds = useMedicationStore((s) => s.load);

  const cameras = useCameraStore((s) => s.cameras);
  const loadCameras = useCameraStore((s) => s.load);

  const notifItems = useNotificationStore((s) => s.items);
  const loadNotifications = useNotificationStore((s) => s.load);

  const loadTodayCheckIn = useCheckInStore((s) => s.loadToday);
  const loadFeed = useFeedStore((s) => s.load);
  const toggleFeedReaction = useFeedStore((s) => s.toggleReaction);

  const [refreshing, setRefreshing] = useState(false);

  const currentElderlyObj =
    dashData && dashData.linkedElderly.length > 0
      ? dashData.linkedElderly[dashData.selectedIndex]
      : null;
  const elderlyId = currentElderlyObj?.elderlyId ?? null;

  const latestByType = dashData?.latestMetrics ?? {};

  const todayCheckIn = useCheckInStore((s) => selectTodayCheckIn(s, elderlyId));
  const feedItems = useFeedStore((s) => selectFeed(s, elderlyId));
  const feedLoading = useFeedStore((s) => s.loading);

  useMountEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    loadNotifications(controller.signal);
    return () => controller.abort();
  });

  useEffect(() => {
    if (!elderlyId) return;
    const controller = new AbortController();
    loadMeds(elderlyId, controller.signal);
    loadCameras(elderlyId, controller.signal);
    loadTodayCheckIn(elderlyId, controller.signal);
    loadFeed(elderlyId, controller.signal);
    return () => controller.abort();
  }, [elderlyId, loadMeds, loadCameras, loadTodayCheckIn, loadFeed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshDashboard();
    if (elderlyId) {
      await Promise.all([
        loadMeds(elderlyId),
        loadCameras(elderlyId),
        loadTodayCheckIn(elderlyId),
        loadFeed(elderlyId),
      ]);
    }
    setRefreshing(false);
  };

  const unreadCount = selectUnreadCount(notifItems);
  const upcoming = (dashData?.upcomingAppointments ?? []).slice(0, 3);

  const hasElderly = !!currentElderlyObj?.elderlyName;
  const elderlyName = currentElderlyObj?.elderlyName ?? '';
  const elderlyPhone = currentElderlyObj?.phone ?? '';
  const healthConditions = currentElderlyObj?.healthConditions ?? [];

  const hr = latestByType['HEART_RATE'];
  const bp = latestByType['BLOOD_PRESSURE'];
  const glucose = latestByType['BLOOD_GLUCOSE'];

  const isBpWarning = bp ? (Number.parseFloat(bp.value) || 0) >= 135 : false;
  const hrValue = hr ? Number.parseFloat(hr.value) || 0 : 0;
  const isHrWarning = hr ? hrValue < 50 || hrValue > 110 : false;
  const glucoseValue = glucose ? Number.parseFloat(glucose.value) || 0 : 0;
  const isGlucoseWarning = glucose ? glucoseValue < 3.9 || glucoseValue > 7.8 : false;

  const allMetricTimestamps = Object.values(latestByType).map((m) =>
    new Date(m.recordedAt).getTime(),
  );
  const lastMetricTime = allMetricTimestamps.length > 0 ? Math.max(...allMetricTimestamps) : null;
  const lastUpdatedLabel = lastMetricTime
    ? formatRelative(new Date(lastMetricTime).toISOString())
    : null;
  const isRecentlyActive = lastMetricTime ? Date.now() - lastMetricTime < 30 * 60 * 1000 : false;

  const cam = cameras.length > 0 ? cameras[0] : null;

  const feedPreview = feedItems.slice(0, 4);

  const openCamera = () => elderlyId && navigation.navigate('CameraScreen', { elderlyId });
  const openHealth = () => navigation.navigate('FamilyHealth');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || dashLoading}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header with Mascot & Notifications */}
        <View style={styles.headerCard}>
          <Image
            source={require('../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
            style={styles.greetingMascot}
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.greetingSmall}>Xin chào gia đình,</Text>
            <Text style={styles.greeting} numberOfLines={1}>
              {user?.name || 'Người chăm sóc'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.qrScanBtn}
              onPress={() => navigation.navigate('FamilyScanQR')}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="qr-code-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color="#0F172A" />
              {unreadCount > 0 && (
                <View style={styles.dotBadge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 16 }} />

        {/* Multi-Elderly Switcher Tabs (UC-22) */}
        {dashData && dashData.linkedElderly.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
            {dashData.linkedElderly.map((e, i) => {
              const isSelected = i === dashData.selectedIndex;
              return (
                <TouchableOpacity
                  key={e.elderlyId}
                  style={[styles.elderlyChip, isSelected && styles.elderlyChipActive]}
                  onPress={() => selectElderly(i)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person"
                    size={15}
                    color={isSelected ? '#FFFFFF' : Colors.primary}
                  />
                  <Text
                    style={[styles.elderlyChipText, isSelected && styles.elderlyChipTextActive]}
                  >
                    {e.elderlyName}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addElderlyChip}
              onPress={() => navigation.navigate('FamilyShell', { screen: 'FamilyProfile' })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addElderlyChipText}>Thêm</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <View style={{ height: 12 }} />

        {/* Elderly Overview Card with Vitals */}
        <ElderlyCard
          hasElderly={hasElderly}
          elderlyName={elderlyName}
          elderlyPhone={elderlyPhone}
          lastUpdatedLabel={lastUpdatedLabel}
          isRecentlyActive={isRecentlyActive}
          healthConditions={healthConditions}
          showVitals={!!elderlyId}
          hrText={hr ? hr.value : '--'}
          bpText={bp ? (bp.valueSecondary ? `${bp.value}/${bp.valueSecondary}` : bp.value) : '--'}
          glucoseText={glucose ? glucose.value : '--'}
          isHrWarning={isHrWarning}
          isBpWarning={isBpWarning}
          isGlucoseWarning={isGlucoseWarning}
          onVitalPress={openHealth}
        />

        {elderlyId && (
          <>
            <View style={{ height: 16 }} />
            <TodayCheckinCard checkIn={todayCheckIn} />
          </>
        )}

        <View style={{ height: 16 }} />

        {/* Today's Medication Card */}
        <TodayMedsCard
          medItems={medItems}
          isLoading={medLoading}
          onViewAll={() => navigation.navigate('FamilyShell', { screen: 'FamilyMeds' })}
        />

        <View style={{ height: 16 }} />

        {/* Weekly AI Summary Report (UC-13) */}
        {elderlyId && (
          <TouchableOpacity
            style={styles.weeklyReportCard}
            onPress={() => navigation.navigate('WeeklySummary')}
            activeOpacity={0.88}
          >
            <View style={styles.weeklyReportIcon}>
              <Ionicons name="sparkles" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.aiTagRow}>
                <Text style={styles.aiTagText}>BÁO CÁO AI HÀNG TUẦN</Text>
              </View>
              <Text style={styles.weeklyTitle}>Đánh giá sức khỏe toàn diện</Text>
              <Text style={styles.weeklySubtitle}>
                Bác sĩ AI phân tích xu hướng tuần & tỷ lệ uống thuốc
              </Text>
            </View>
            <Ionicons name="chevron-forward" color="#4F46E5" size={22} />
          </TouchableOpacity>
        )}

        <View style={{ height: 16 }} />

        {/* Camera Monitor Preview Card (UC-27, UC-32) */}
        {elderlyId && (
          <>
            <DashboardCameraCard cam={cam} onOpenCamera={openCamera} />
            <View style={{ height: 16 }} />
          </>
        )}

        {/* Family Care Feed preview (UC A2) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Dòng thời gian gia đình</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FamilyFeed')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 10 }} />
        {feedLoading && feedPreview.length === 0 ? (
          <View style={styles.feedCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : feedPreview.length === 0 ? (
          <View style={styles.feedCard}>
            <Text style={styles.feedEmptyText}>Chưa có hoạt động nào gần đây</Text>
          </View>
        ) : (
          <View style={styles.feedCard}>
            {feedPreview.map((item, idx) => (
              <View key={item.id}>
                <FeedRow
                  item={item}
                  onToggleReaction={(it) => elderlyId && toggleFeedReaction(elderlyId, it)}
                />
                {idx < feedPreview.length - 1 && <View style={styles.feedDivider} />}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />

        {/* Upcoming Appointments Preview (UC-21) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch hẹn khám bệnh viện</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FamilyShell', { screen: 'FamilyAppointmentsTab' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>Quản lý →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 10 }} />
        {dashLoading && upcoming.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" color="#94A3B8" size={32} />
            <Text style={[styles.emptyBoxText, { marginTop: 6 }]}>
              Chưa có lịch hẹn khám sắp tới
            </Text>
          </View>
        ) : (
          upcoming.map((appt) => (
            <AppointmentPreviewCard
              key={appt.id}
              apt={appt}
              onPress={() =>
                navigation.navigate('FamilyShell', { screen: 'FamilyAppointmentsTab' })
              }
            />
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 18 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  greetingMascot: { width: 44, height: 44, borderRadius: 22 },
  greetingSmall: { color: '#64748B', fontSize: 12.5, fontWeight: '500' },
  greeting: { color: '#0F172A', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  qrScanBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  selector: { marginBottom: 8 },
  elderlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#E6F7F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#99E6E0',
  },
  elderlyChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  elderlyChipText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  elderlyChipTextActive: { color: '#FFFFFF' },
  addElderlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  addElderlyChipText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  weeklyReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    ...Shadows.sm,
  },
  weeklyReportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTagRow: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  aiTagText: { fontSize: 10.5, fontWeight: '800', color: '#4338CA' },
  weeklyTitle: { fontSize: 15.5, fontWeight: '800', color: '#1E1B4B' },
  weeklySubtitle: { fontSize: 12.5, color: '#4338CA', marginTop: 2, fontWeight: '500' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  viewAllText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  loadingBox: { height: 80, justifyContent: 'center', alignItems: 'center' },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 60,
    justifyContent: 'center',
  },
  feedDivider: { height: 1, backgroundColor: '#EEF2F6' },
  feedEmptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyBoxText: { color: '#64748B', fontSize: 13.5, fontWeight: '500' },
});
