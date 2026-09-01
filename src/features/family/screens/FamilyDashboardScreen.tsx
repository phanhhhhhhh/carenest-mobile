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
import { useEmergencyEventStore } from '../store/emergencyEventStore';
import { useCameraStore } from '../store/cameraStore';
import { useMedicationStore } from '../../elderly/store/medicationStore';
import {
  useNotificationStore,
  selectUnreadCount,
} from '../../notifications/store/notificationStore';
import { formatRelative } from './familyDashboard/utils';
import { useDashboardActivity } from './familyDashboard/useDashboardActivity';
import { ElderlyCard } from './familyDashboard/ElderlyCard';
import { TodayMedsCard } from './familyDashboard/TodayMedsCard';
import { DashboardCameraCard } from './familyDashboard/DashboardCameraCard';
import { ActivityCard } from './familyDashboard/ActivityCard';
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

  const alertEvents = useEmergencyEventStore((s) => s.events);
  const alertLoading = useEmergencyEventStore((s) => s.isLoading);
  const loadAlerts = useEmergencyEventStore((s) => s.load);

  const notifItems = useNotificationStore((s) => s.items);
  const loadNotifications = useNotificationStore((s) => s.load);

  const [refreshing, setRefreshing] = useState(false);

  const elderlyId =
    dashData && dashData.linkedElderly.length > 0
      ? (dashData.linkedElderly[dashData.selectedIndex]?.elderlyId ?? null)
      : null;

  // Vitals and upcoming appointments come from the dashboard aggregate response
  // (familyStore) rather than separate healthMetric/appointment fetches.
  const latestByType = dashData?.latestMetrics ?? {};
  const healthIsLoading = dashLoading;

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
    loadAlerts(elderlyId, controller.signal);
    return () => controller.abort();
  }, [elderlyId, loadMeds, loadCameras, loadAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshDashboard();
    if (elderlyId) {
      await Promise.all([loadMeds(elderlyId), loadCameras(elderlyId), loadAlerts(elderlyId)]);
    }
    setRefreshing(false);
  };

  const unreadCount = selectUnreadCount(notifItems);
  const upcoming = (dashData?.upcomingAppointments ?? []).slice(0, 3);

  const hasElderly = !!dashData?.linkedElderly[dashData.selectedIndex]?.elderlyName;
  const elderlyName = dashData?.linkedElderly[dashData.selectedIndex]?.elderlyName ?? '';
  const healthConditions = dashData?.linkedElderly[dashData.selectedIndex]?.healthConditions ?? [];

  const hr = latestByType['HEART_RATE'];
  const bp = latestByType['BLOOD_PRESSURE'];
  const glucose = latestByType['BLOOD_GLUCOSE'];
  // Quick-glance thresholds (systolic >=135, resting HR ngoài 50-110,
  // đường huyết mmol/L ngoài 3.9-7.8). Chi tiết hơn xem FamilyHealth.
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

  const activityItems = useDashboardActivity({
    elderlyId,
    alertEvents,
    alertLoading,
    medItems,
    medLoading,
    latestByType,
    healthLoading: healthIsLoading,
  });

  const openCamera = () => elderlyId && navigation.navigate('CameraScreen', { elderlyId });
  const openHealth = () => navigation.navigate('FamilyHealth');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || dashLoading}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.headerCard}>
          <Image
            source={require('../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
            style={styles.greetingMascot}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>Xin chào,</Text>
            <Text style={styles.greeting}>{user?.name || 'Gia đình'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.dotBadge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 18 }} />

        {dashData && dashData.linkedElderly.length > 1 && (
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
          </ScrollView>
        )}

        <ElderlyCard
          hasElderly={hasElderly}
          elderlyName={elderlyName}
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

        <View style={{ height: 18 }} />

        <TodayMedsCard
          medItems={medItems}
          isLoading={medLoading}
          onViewAll={() => navigation.navigate('FamilyShell', { screen: 'FamilyMeds' })}
        />

        <View style={{ height: 18 }} />

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
              <Text style={styles.weeklyTitle}>Tổng hợp & Đánh giá sức khỏe</Text>
              <Text style={styles.weeklySubtitle}>
                Xem phân tích xu hướng tuần này của người thân
              </Text>
            </View>
            <Ionicons name="chevron-forward" color={Colors.aiPrimary} size={22} />
          </TouchableOpacity>
        )}

        <View style={{ height: 18 }} />

        {elderlyId && (
          <>
            <DashboardCameraCard cam={cam} onOpenCamera={openCamera} />
            <View style={{ height: 18 }} />
          </>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cảnh báo gần đây</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FamilyAlerts')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 12 }} />
        <ActivityCard items={activityItems} />

        <View style={{ height: 22 }} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch hẹn khám bệnh</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FamilyShell', { screen: 'FamilyAppointmentsTab' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 12 }} />
        {dashLoading && upcoming.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" color={Colors.textHint} size={32} />
            <Text style={[styles.emptyBoxText, { marginTop: 6 }]}>
              Chưa có lịch hẹn khám sắp tới
            </Text>
          </View>
        ) : (
          upcoming.map((apt) => (
            <AppointmentPreviewCard
              key={apt.id}
              apt={apt}
              onPress={() =>
                navigation.navigate('FamilyShell', { screen: 'FamilyAppointmentsTab' })
              }
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  greetingMascot: { width: 56, height: 56, marginRight: 12 },
  greetingSmall: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  greeting: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 1 },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  selector: { marginBottom: 16 },
  elderlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  elderlyChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  elderlyChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  elderlyChipTextActive: { color: '#FFFFFF' },

  weeklyReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 22,
    backgroundColor: Colors.aiLighter,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    shadowColor: Colors.aiPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  weeklyReportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.aiPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTagRow: { marginBottom: 2 },
  aiTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.aiPrimary,
    letterSpacing: 0.5,
  },
  weeklyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#312E81',
  },
  weeklySubtitle: {
    fontSize: 12,
    color: '#4338CA',
    marginTop: 2,
  },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.primary,
  },

  loadingBox: { height: 60, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    width: '100%',
    padding: 24,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: 13 },
});
