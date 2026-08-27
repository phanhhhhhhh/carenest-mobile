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
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useEmergencyEventStore } from '../store/emergencyEventStore';
import { useCameraStore } from '../store/cameraStore';
import { useMedicationStore } from '../../elderly/store/medicationStore';
import {
  useNotificationStore,
  selectUnreadCount,
} from '../../notifications/store/notificationStore';
import { formatRelative, hexToRgba } from './familyDashboard/utils';
import { useDashboardActivity } from './familyDashboard/useDashboardActivity';
import { ElderlyCard } from './familyDashboard/ElderlyCard';
import { TodayMedsCard } from './familyDashboard/TodayMedsCard';
import { DashboardCameraCard } from './familyDashboard/DashboardCameraCard';
import { ActivityCard } from './familyDashboard/ActivityCard';
import { AppointmentPreviewCard } from './familyDashboard/widgets';

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

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    loadNotifications(controller.signal);
    return () => controller.abort();
    // Load once on mount; the loaders are stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!elderlyId) return;
    const controller = new AbortController();
    loadMeds(elderlyId, controller.signal);
    loadCameras(elderlyId, controller.signal);
    loadAlerts(elderlyId, controller.signal);
    return () => controller.abort();
    // Re-run when the selected elderly changes; the loaders are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId]);

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
        <View style={styles.headerRow}>
          <Image
            source={require('../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
            style={styles.greetingMascot}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSmall}>Xin chào,</Text>
            <Text style={styles.greeting}>{user?.name || 'bạn'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={26} color={Colors.textPrimary} />
            {unreadCount > 0 && <View style={styles.dotBadge} />}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />

        {dashData && dashData.linkedElderly.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
            {dashData.linkedElderly.map((e, i) => {
              const isSelected = i === dashData.selectedIndex;
              return (
                <TouchableOpacity
                  key={e.elderlyId}
                  style={[styles.elderlyChip, isSelected && styles.elderlyChipActive]}
                  onPress={() => selectElderly(i)}
                >
                  <Ionicons
                    name="body-outline"
                    size={16}
                    color={isSelected ? 'white' : Colors.primary}
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

        <View style={{ height: 24 }} />

        <TodayMedsCard
          medItems={medItems}
          isLoading={medLoading}
          onViewAll={() => navigation.navigate('FamilyShell', { screen: 'FamilyMeds' })}
        />

        <View style={{ height: 24 }} />

        {elderlyId && (
          <TouchableOpacity
            style={styles.weeklyReportCard}
            onPress={() => navigation.navigate('WeeklySummary')}
          >
            <View style={styles.weeklyReportIcon}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.sectionTitle}>Báo cáo tuần</Text>
              <Text style={styles.emptyBoxText}>Tổng hợp sức khỏe do AI tạo</Text>
            </View>
            <Ionicons name="chevron-forward" color={Colors.textHint} size={20} />
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />

        {elderlyId && (
          <>
            <DashboardCameraCard cam={cam} onOpenCamera={openCamera} />
            <View style={{ height: 24 }} />
          </>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cảnh báo gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FamilyAlerts')}>
            <Text style={styles.viewAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 14 }} />
        <ActivityCard items={activityItems} />

        <View style={{ height: 24 }} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch hẹn sắp tới</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FamilyShell', { screen: 'FamilyAppointmentsTab' })}
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
            <Text style={[styles.emptyBoxText, { marginTop: 8 }]}>Chưa có lịch hẹn nào</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greetingMascot: { width: 52, height: 52, marginRight: 10 },
  greetingSmall: { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, flexShrink: 1 },
  bellButton: { padding: 4 },
  dotBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.warning,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  selector: { marginBottom: 16 },
  elderlyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.3),
  },
  elderlyChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  elderlyChipText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  elderlyChipTextActive: { color: 'white' },

  weeklyReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.25),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  weeklyReportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: hexToRgba(Colors.primary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.primary,
  },

  loadingBox: { height: 60, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: Typography.bodySmall.fontSize },
});
