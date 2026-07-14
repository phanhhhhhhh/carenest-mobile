import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useEmergencyEventStore } from '../store/emergencyEventStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useCameraStore } from '../store/cameraStore';
import { useMedicationStore } from '../../elderly/store/medicationStore';
import { useHealthMetricStore } from '../../elderly/store/healthMetricStore';
import { useNotificationStore, selectUnreadCount } from '../../notifications/store/notificationStore';
import type { AppointmentItem, MedicationItem } from '../../../shared/types';

/**
 * Port of Flutter's family_dashboard_screen.dart (FamilyDashboardScreen).
 *
 * Notes on deviations:
 * - The Flutter elderly card used a `LinearGradient` (AppColors.primary ->
 *   #1A5570). No gradient dependency is installed in this project (see the
 *   same note in FamilyMedicationScreen.tsx), so it falls back to a solid
 *   `Colors.primaryDark` background — the only visual deviation.
 * - `Icons.elderly` has no exact Ionicons equivalent; `body-outline` /
 *   `body` is used as the closest stand-in.
 * - Navigation targets `CameraScreen` and `FamilyAppointments` are being
 *   created in a parallel task and are not yet registered in the navigator
 *   param lists, so they are reached via an untyped `navigate` call —
 *   see `// TODO(routing)` below.
 */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatRelative(iso: string): string {
  const dt = new Date(iso);
  const diffMs = Date.now() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (startOfDay(new Date()).getTime() - startOfDay(dt).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffMinutes < 1) return 'Just now';
  if (diffHours < 1) return `${diffMinutes}m ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function formatDoseTime(med: MedicationItem): string {
  if (med.nextDoseTime) {
    const d = new Date(med.nextDoseTime);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  return med.scheduleTimes.length > 0 ? med.scheduleTimes[0] : '';
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FamilyDashboardScreen() {
  const navigation = useNavigation<any>();
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

  const appointments = useAppointmentStore((s) => s.appointments);
  const appointmentsLoading = useAppointmentStore((s) => s.isLoading);
  const loadAppointments = useAppointmentStore((s) => s.load);
  const upcomingAppointments = useAppointmentStore((s) => s.upcoming);

  const alertEvents = useEmergencyEventStore((s) => s.events);
  const alertLoading = useEmergencyEventStore((s) => s.isLoading);
  const loadAlerts = useEmergencyEventStore((s) => s.load);

  const notifItems = useNotificationStore((s) => s.items);
  const loadNotifications = useNotificationStore((s) => s.load);

  const [refreshing, setRefreshing] = useState(false);

  const elderlyId =
    dashData && dashData.linkedElderly.length > 0
      ? dashData.linkedElderly[dashData.selectedIndex]?.elderlyId ?? null
      : null;

  const healthState = useHealthMetricStore(elderlyId ?? '');

  useEffect(() => {
    loadDashboard();
    loadAppointments();
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!elderlyId) return;
    loadMeds(elderlyId);
    loadCameras(elderlyId);
    loadAlerts(elderlyId);
    healthState.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshDashboard();
    await loadAppointments();
    if (elderlyId) {
      await Promise.all([loadMeds(elderlyId), loadCameras(elderlyId), loadAlerts(elderlyId), healthState.load()]);
    }
    setRefreshing(false);
  };

  const unreadCount = selectUnreadCount(notifItems);
  const upcoming = upcomingAppointments().slice(0, 3);

  const hasElderly = !!dashData?.linkedElderly[dashData.selectedIndex]?.elderlyName;
  const elderlyName = dashData?.linkedElderly[dashData.selectedIndex]?.elderlyName ?? '';
  const healthConditions = dashData?.linkedElderly[dashData.selectedIndex]?.healthConditions ?? [];

  const hr = healthState.latestByType['HEART_RATE'];
  const bp = healthState.latestByType['BLOOD_PRESSURE'];
  const glucose = healthState.latestByType['BLOOD_GLUCOSE'];
  const isBpWarning = bp ? (Number.parseFloat(bp.value) || 0) >= 135 : false;

  const takenMeds = medItems.filter((m) => m.taken).length;

  const hasCamera = cameras.length > 0;
  const cam = hasCamera ? cameras[0] : null;
  const camOnline = cam?.status === 'ONLINE';

  // Build combined "recent activity" list (mirrors Dart's _buildRecentActivity)
  type ActivityItem = { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; subtitle: string; time: string };
  const activityItems: ActivityItem[] = [];
  if (elderlyId) {
    if (!medLoading && medItems.length > 0) {
      for (const med of medItems.slice(0, 3)) {
        const timeLabel = formatDoseTime(med);
        activityItems.push({
          icon: 'medical-outline',
          color: Colors.primary,
          title: med.name,
          subtitle: `${med.dosage}${timeLabel ? ` at ${timeLabel}` : ''}`,
          time: med.taken ? 'Taken' : 'Upcoming',
        });
      }
    }
    if (!healthState.isLoading && Object.keys(healthState.latestByType).length > 0) {
      const entries = Object.entries(healthState.latestByType).slice(0, 2);
      for (const [type, data] of entries) {
        const typeLabel =
          type === 'BLOOD_PRESSURE'
            ? 'Blood Pressure'
            : type === 'BLOOD_GLUCOSE'
              ? 'Blood Sugar'
              : type === 'HEART_RATE'
                ? 'Heart Rate'
                : type;
        const valueStr = data.valueSecondary ? `${data.value}/${data.valueSecondary}` : data.value;
        activityItems.push({
          icon: 'pulse-outline',
          color: Colors.success,
          title: `${typeLabel} reading`,
          subtitle: `${valueStr} ${data.unit ?? ''}`.trim(),
          time: formatRelative(data.recordedAt),
        });
      }
    }
    if (!alertLoading && alertEvents.length > 0) {
      const active = alertEvents.filter((e) => e.status === 'ACTIVE').slice(0, 1);
      for (const event of active) {
        activityItems.push({
          icon: 'warning-outline',
          color: Colors.warning,
          title: event.type === 'SOS' ? 'SOS Emergency' : 'Alert',
          subtitle: event.description,
          time: formatRelative(event.createdAt),
        });
      }
    }
  }
  if (activityItems.length === 0) {
    activityItems.push({
      icon: 'information-circle-outline',
      color: Colors.textHint,
      title: 'No activity yet',
      subtitle: 'Data appears when new activity occurs',
      time: '',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing || dashLoading} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>{getGreeting()}, {user?.name || 'you'}!</Text>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
              // TODO(routing): Notifications route not part of this task's
              // scope — no confirmed route name to navigate to yet.
            }}
          >
            <Ionicons name="notifications-outline" size={26} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />

        {/* Elderly selector */}
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
                  <Ionicons name="body-outline" size={16} color={isSelected ? 'white' : Colors.primary} />
                  <Text style={[styles.elderlyChipText, isSelected && styles.elderlyChipTextActive]}>{e.elderlyName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Elderly card */}
        <View style={styles.elderlyCard}>
          <View style={styles.elderlyCardTopRow}>
            <View style={styles.elderlyAvatar}>
              <Ionicons name="body" color="white" size={28} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.elderlyCardLabel}>Your loved one</Text>
              <Text style={styles.elderlyCardName}>{hasElderly ? elderlyName : 'Not linked'}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: hasElderly ? Colors.success : Colors.textHint }]} />
          </View>
          {hasElderly && healthConditions.length > 0 && (
            <View style={styles.conditionsWrap}>
              {healthConditions.map((c, idx) => (
                <View key={`${c}-${idx}`} style={styles.conditionChip}>
                  <Text style={styles.conditionChipText}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />

        {/* Vitals row */}
        {elderlyId && (
          <View style={styles.vitalsRow}>
            <VitalMiniCard
              label="Nhịp tim"
              value={hr ? hr.value : '--'}
              isWarning={false}
              onPress={() => navigation.navigate('FamilyHealth')}
            />
            <View style={{ width: 10 }} />
            <VitalMiniCard
              label="Huyết áp"
              value={bp ? (bp.valueSecondary ? `${bp.value}/${bp.valueSecondary}` : bp.value) : '--'}
              isWarning={isBpWarning}
              onPress={() => navigation.navigate('FamilyHealth')}
            />
            <View style={{ width: 10 }} />
            <VitalMiniCard
              label="Đường"
              value={glucose ? glucose.value : '--'}
              isWarning={false}
              onPress={() => navigation.navigate('FamilyHealth')}
            />
          </View>
        )}

        <View style={{ height: 24 }} />

        {/* Medication today */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
          <View style={styles.sectionHeaderRight}>
            {medItems.length > 0 && (
              <Text style={styles.medFraction}>{takenMeds}/{medItems.length}</Text>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('FamilyMeds')}>
              <Text style={styles.viewAllText}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 10 }} />
        {medLoading && medItems.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : medItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>Chưa có thuốc nào</Text>
          </View>
        ) : (
          <View style={styles.medCard}>
            {medItems.slice(0, 4).map((med, idx) => (
              <View key={med.id} style={[styles.medRow, idx > 0 && styles.medRowDivider]}>
                <Ionicons
                  name={med.taken ? 'checkmark-circle' : 'time'}
                  size={22}
                  color={med.taken ? Colors.success : Colors.warning}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.medName}>{med.name} {med.dosage}</Text>
                  <Text style={styles.medTime}>{formatDoseTime(med)}</Text>
                </View>
                <Text style={[styles.medStatus, { color: med.taken ? Colors.success : Colors.warning }]}>
                  {med.taken ? 'Đã uống' : 'Sắp tới'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />

        {/* Camera preview */}
        {elderlyId && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{cam ? `Camera — ${cam.label}` : 'Camera'}</Text>
              {hasCamera && camOnline && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>
            <View style={{ height: 10 }} />
            {!hasCamera ? (
              <View style={styles.emptyBox}>
                <Ionicons name="videocam-off" color={Colors.textHint} size={32} />
                <Text style={[styles.emptyBoxText, { marginTop: 8 }]}>Chưa liên kết camera nào</Text>
                <TouchableOpacity
                  onPress={() => {
                    // TODO(routing): CameraScreen is being added in a parallel
                    // task; param shape (elderlyId) is a best guess.
                    navigation.navigate('CameraScreen', { elderlyId });
                  }}
                >
                  <Text style={[styles.viewAllText, { marginTop: 8 }]}>+ Thêm camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraCard}>
                <View style={styles.cameraPreviewBox}>
                  <Ionicons name={camOnline ? 'play-circle' : 'videocam-off'} color="rgba(255,255,255,0.54)" size={40} />
                </View>
                <View style={{ height: 12 }} />
                <View style={styles.cameraActionsRow}>
                  <CameraActionButton icon="play" label="Xem" onPress={() => navigation.navigate('CameraScreen', { elderlyId })} />
                  <View style={{ width: 8 }} />
                  <CameraActionButton icon="mic" label="Gọi" onPress={() => navigation.navigate('CameraScreen', { elderlyId })} />
                  <View style={{ width: 8 }} />
                  <CameraActionButton icon="calendar" label="Check-in" onPress={() => navigation.navigate('CameraScreen', { elderlyId })} />
                </View>
              </View>
            )}
            <View style={{ height: 24 }} />
          </>
        )}

        {/* Recent activity / alerts */}
        <Text style={styles.sectionTitle}>Cảnh báo gần đây</Text>
        <View style={{ height: 14 }} />
        <View style={styles.activityCard}>
          {activityItems.map((item, idx) => (
            <View key={idx}>
              <View style={styles.activityRow}>
                <View style={[styles.activityIconBox, { backgroundColor: hexToRgba(item.color, 0.08) }]}>
                  <Ionicons name={item.icon} color={item.color} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
              {idx < activityItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />

        {/* Upcoming appointments */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity
            onPress={() => {
              // TODO(routing): FamilyAppointments is being added in a
              // parallel task; no params required as of this writing.
              navigation.navigate('FamilyAppointments');
            }}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 12 }} />
        {appointmentsLoading && appointments.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" color={Colors.textHint} size={32} />
            <Text style={[styles.emptyBoxText, { marginTop: 8 }]}>No appointments yet</Text>
          </View>
        ) : (
          upcoming.map((apt) => (
            <AppointmentPreviewCard key={apt.id} apt={apt} onPress={() => navigation.navigate('FamilyAppointments')} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function VitalMiniCard({
  label,
  value,
  isWarning,
  onPress,
}: {
  label: string;
  value: string;
  isWarning: boolean;
  onPress: () => void;
}) {
  const statusColor = isWarning ? Colors.error : Colors.success;
  return (
    <TouchableOpacity style={styles.vitalCard} onPress={onPress}>
      <Text style={styles.vitalLabel}>{label.toUpperCase()}</Text>
      <View style={{ height: 4 }} />
      <Text style={styles.vitalValue}>{value}</Text>
      <View style={{ height: 4 }} />
      <View style={styles.vitalStatusRow}>
        <View style={[styles.vitalDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.vitalStatusText, { color: statusColor }]}>{isWarning ? 'Cảnh báo' : 'OK'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CameraActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.cameraActionButton} onPress={onPress}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.cameraActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function AppointmentPreviewCard({ apt, onPress }: { apt: AppointmentItem; onPress: () => void }) {
  const date = new Date(apt.appointmentDate);
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const day = date.getDate();
  const monthStr = MONTHS[date.getMonth()];
  return (
    <TouchableOpacity style={styles.aptCard} onPress={onPress}>
      <View style={styles.aptDateBox}>
        <Text style={styles.aptDay}>{day}</Text>
        <Text style={styles.aptMonth}>{monthStr}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.aptDoctor}>{apt.doctor}</Text>
        <Text style={styles.aptDetail}>{apt.specialty} • {timeStr}</Text>
      </View>
      <Ionicons name="chevron-forward" color={Colors.textHint} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, flexShrink: 1 },
  bellButton: { padding: 4 },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },

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
  elderlyChipText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  elderlyChipTextActive: { color: 'white' },

  elderlyCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  elderlyCardTopRow: { flexDirection: 'row', alignItems: 'center' },
  elderlyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  elderlyCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  elderlyCardName: { color: 'white', fontSize: 20, fontWeight: '700', marginTop: 2 },
  statusDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  conditionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  conditionChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  conditionChipText: { color: 'white', fontSize: 12 },

  vitalsRow: { flexDirection: 'row' },
  vitalCard: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.25),
  },
  vitalLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 0.4 },
  vitalValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  vitalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vitalDot: { width: 7, height: 7, borderRadius: 3.5 },
  vitalStatusText: { fontSize: 9 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  medFraction: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  viewAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  loadingBox: { height: 60, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    width: '100%',
    padding: 20,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: 13 },

  medCard: {
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  medRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: hexToRgba(Colors.textHint, 0.2) },
  medName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  medTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  medStatus: { fontSize: 11, fontWeight: '600' },

  liveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: hexToRgba(Colors.error, 0.1) },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.error },
  cameraCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cameraPreviewBox: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraActionsRow: { flexDirection: 'row' },
  cameraActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.primary, 0.4),
  },
  cameraActionLabel: { fontSize: 12, color: Colors.primary },

  activityCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { fontWeight: '600', color: Colors.textPrimary, fontSize: 14 },
  activitySubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  activityTime: { color: Colors.textHint, fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: hexToRgba(Colors.textHint, 0.25), marginVertical: 10 },

  aptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  aptDateBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: hexToRgba(Colors.primary, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  aptDay: { fontWeight: '700', fontSize: 16, color: Colors.primary },
  aptMonth: { fontSize: 10, color: Colors.primary },
  aptDoctor: { fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  aptDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
