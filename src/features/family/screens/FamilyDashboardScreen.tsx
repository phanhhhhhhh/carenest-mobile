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
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useEmergencyEventStore } from '../store/emergencyEventStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useCameraStore } from '../store/cameraStore';
import { useMedicationStore } from '../../elderly/store/medicationStore';
import { useHealthMetricStore } from '../../elderly/store/healthMetricStore';
import { useNotificationStore, selectUnreadCount } from '../../notifications/store/notificationStore';
import type { AppointmentItem, MedicationItem } from '../../../shared/types';



type Nav = NativeStackNavigationProp<RootStackParamList>;

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

  const healthStore = useHealthMetricStore(elderlyId ?? '');
  const healthIsLoading = healthStore((s) => s.isLoading);
  const latestByType = healthStore((s) => s.latestByType);

  useEffect(() => {
    loadDashboard();
    loadAppointments();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!elderlyId) return;
    loadMeds(elderlyId);
    loadCameras(elderlyId);
    loadAlerts(elderlyId);
    healthStore.getState().load();
  }, [elderlyId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshDashboard();
    await loadAppointments();
    if (elderlyId) {
      await Promise.all([loadMeds(elderlyId), loadCameras(elderlyId), loadAlerts(elderlyId), healthStore.getState().load()]);
    }
    setRefreshing(false);
  };

  const unreadCount = selectUnreadCount(notifItems);
  const upcoming = upcomingAppointments().slice(0, 3);

  const hasElderly = !!dashData?.linkedElderly[dashData.selectedIndex]?.elderlyName;
  const elderlyName = dashData?.linkedElderly[dashData.selectedIndex]?.elderlyName ?? '';
  const healthConditions = dashData?.linkedElderly[dashData.selectedIndex]?.healthConditions ?? [];

  const hr = latestByType['HEART_RATE'];
  const bp = latestByType['BLOOD_PRESSURE'];
  const glucose = latestByType['BLOOD_GLUCOSE'];
  const isBpWarning = bp ? (Number.parseFloat(bp.value) || 0) >= 135 : false;

  const takenMeds = medItems.filter((m) => m.taken).length;

  const allMetricTimestamps = Object.values(latestByType).map((m) => new Date(m.recordedAt).getTime());
  const lastMetricTime = allMetricTimestamps.length > 0 ? Math.max(...allMetricTimestamps) : null;
  const lastUpdatedLabel = lastMetricTime ? formatRelative(new Date(lastMetricTime).toISOString()) : null;
  const isRecentlyActive = lastMetricTime ? Date.now() - lastMetricTime < 30 * 60 * 1000 : false;

  const hasCamera = cameras.length > 0;
  const cam = hasCamera ? cameras[0] : null;
  const camOnline = cam?.status === 'ONLINE';

  type ActivityItem = { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; subtitle: string; time: string };
  const activityItems: ActivityItem[] = [];
  if (elderlyId) {
    if (!alertLoading && alertEvents.length > 0) {
      const active = alertEvents.filter((e) => e.status === 'ACTIVE').slice(0, 2);
      for (const event of active) {
        activityItems.push({
          icon: 'warning',
          color: Colors.error,
          title: event.type === 'SOS' ? 'Cảnh báo khẩn cấp (SOS)' : 'Cảnh báo',
          subtitle: event.description,
          time: formatRelative(event.createdAt),
        });
      }
    }
    if (!medLoading && medItems.length > 0 && activityItems.length < 3) {
      const takenRecently = medItems.filter((m) => m.taken).slice(0, 3 - activityItems.length);
      for (const med of takenRecently) {
        activityItems.push({
          icon: 'medical',
          color: Colors.success,
          title: `Đã uống ${med.name}`,
          subtitle: med.dosage,
          time: formatDoseTime(med) ? `Lúc ${formatDoseTime(med)}` : '',
        });
      }
    }
    if (!healthIsLoading && Object.keys(latestByType).length > 0 && activityItems.length < 3) {
      const entries = Object.entries(latestByType).slice(0, 3 - activityItems.length);
      for (const [type, data] of entries) {
        const typeLabel =
          type === 'BLOOD_PRESSURE'
            ? 'Huyết áp'
            : type === 'BLOOD_GLUCOSE'
              ? 'Đường huyết'
              : type === 'HEART_RATE'
                ? 'Nhịp tim'
                : type;
        const valueStr = data.valueSecondary ? `${data.value}/${data.valueSecondary}` : data.value;
        activityItems.push({
          icon: 'pulse',
          color: Colors.primary,
          title: `Đo ${typeLabel}`,
          subtitle: `${valueStr} ${data.unit ?? ''}`.trim(),
          time: formatRelative(data.recordedAt),
        });
      }
    }
  }
  if (activityItems.length === 0) {
    activityItems.push({
      icon: 'checkmark-circle-outline',
      color: Colors.textHint,
      title: 'Chưa có cảnh báo nào',
      subtitle: 'Mọi thứ đang ổn',
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingSmall}>Xin chào,</Text>
            <Text style={styles.greeting}>{user?.name || 'bạn'}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
            }}
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
                  <Ionicons name="body-outline" size={16} color={isSelected ? 'white' : Colors.primary} />
                  <Text style={[styles.elderlyChipText, isSelected && styles.elderlyChipTextActive]}>{e.elderlyName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.elderlyCard}>
          <View style={styles.elderlyCardTopRow}>
            <View style={styles.elderlyAvatar}>
              <Ionicons name="body" color="white" size={28} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.elderlyCardName}>
                <Text style={styles.elderlyCardLabelInline}>Người thân: </Text>
                {hasElderly ? elderlyName : 'Chưa liên kết'}
              </Text>
              {hasElderly && (
                <Text style={styles.elderlyCardUpdated}>
                  {lastUpdatedLabel ? `Cập nhật: ${lastUpdatedLabel}` : 'Chưa có dữ liệu mới'}
                </Text>
              )}
            </View>
            {hasElderly && (
              <View style={[styles.onlinePill, { backgroundColor: isRecentlyActive ? 'rgba(76,217,100,0.25)' : 'rgba(255,255,255,0.15)' }]}>
                <View style={[styles.onlineDot, { backgroundColor: isRecentlyActive ? Colors.success : 'rgba(255,255,255,0.6)' }]} />
                <Text style={styles.onlinePillText}>{isRecentlyActive ? 'Online' : 'Offline'}</Text>
              </View>
            )}
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

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FamilyMeds')}>
            <Text style={styles.viewAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
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
          <View style={styles.medCardRow}>
            <MedProgressRing taken={takenMeds} total={medItems.length} />
            <View style={{ width: 14 }} />
            <View style={{ flex: 1 }}>
              {medItems.slice(0, 4).map((med) => (
                <View key={med.id} style={styles.medListRow}>
                  <Text style={[styles.medCheckMark, { color: med.taken ? Colors.success : Colors.error }]}>
                    {med.taken ? '✓' : '✗'}
                  </Text>
                  <Text style={styles.medListName} numberOfLines={1}>
                    {med.name} {med.dosage}
                  </Text>
                  <Text style={[styles.medListTime, !med.taken && { color: Colors.warning }]}>
                    {formatDoseTime(med)}{!med.taken ? ' (sắp tới)' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />

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
                  onPress={() => navigation.navigate('CameraScreen', { elderlyId })}
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

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FamilyAppointments')}>
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


function MedProgressRing({ taken, total }: { taken: number; total: number }) {
  const size = 60;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? taken / total : 0;
  const dashOffset = circumference * (1 - progress);
  const ringColor = progress >= 1 ? Colors.success : Colors.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={hexToRgba(Colors.textHint, 0.2)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.ringText}>{taken}/{total}</Text>
    </View>
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
        <View style={[styles.vitalDot, { borderColor: statusColor }]} />
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
  scroll: { padding: Spacing.xl },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
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
  badgeText: { color: 'white', fontSize: Typography.badge.fontSize, fontWeight: '700' },

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
  elderlyChipText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Colors.textPrimary },
  elderlyChipTextActive: { color: 'white' },

  elderlyCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
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
  elderlyCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.bodySmall.fontSize },
  elderlyCardLabelInline: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  elderlyCardName: { color: 'white', fontSize: 18, fontWeight: '700', marginTop: 2 },
  elderlyCardUpdated: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3 },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlinePillText: { color: 'white', fontSize: 11, fontWeight: '600' },
  statusDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  conditionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  conditionChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  conditionChipText: { color: 'white', fontSize: 12 },

  vitalsRow: { flexDirection: 'row' },
  vitalCard: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.textHint, 0.25),
  },
  vitalLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 0.4 },
  vitalValue: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Colors.textPrimary },
  vitalStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vitalDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, backgroundColor: 'transparent' },
  vitalStatusText: { fontSize: 9 },

  medCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  ringText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  medListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  medCheckMark: { fontSize: 15, fontWeight: '700', width: 18 },
  medListName: { flex: 1, fontSize: Typography.buttonSmall.fontSize, fontWeight: '600', color: Colors.textPrimary },
  medListTime: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: Typography.sectionTitle.fontSize, fontWeight: '700', color: Colors.textPrimary },
  medFraction: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Colors.textSecondary },
  viewAllText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Colors.primary },

  loadingBox: { height: 60, justifyContent: 'center', alignItems: 'center' },
  emptyBox: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyBoxText: { color: Colors.textSecondary, fontSize: Typography.bodySmall.fontSize },

  medCard: {
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  medRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: hexToRgba(Colors.textHint, 0.2) },
  medName: { fontSize: Typography.buttonSmall.fontSize, fontWeight: '600', color: Colors.textPrimary },
  medTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  medStatus: { fontSize: Typography.caption.fontSize, fontWeight: '600' },

  liveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: hexToRgba(Colors.error, 0.1) },
  liveBadgeText: { fontSize: Typography.caption.fontSize, fontWeight: '700', color: Colors.error },
  cameraCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.primary, 0.4),
  },
  cameraActionLabel: { fontSize: 12, color: Colors.primary },

  activityCard: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityIconBox: { width: 40, height: 40, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { fontWeight: '600', color: Colors.textPrimary, fontSize: Typography.buttonSmall.fontSize },
  activitySubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  activityTime: { color: Colors.textHint, fontSize: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: hexToRgba(Colors.textHint, 0.25), marginVertical: 10 },

  aptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    padding: 14,
    borderRadius: BorderRadius.md,
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
  aptDay: { fontWeight: '700', fontSize: Typography.cardTitle.fontSize, color: Colors.primary },
  aptMonth: { fontSize: 10, color: Colors.primary },
  aptDoctor: { fontWeight: '600', fontSize: Typography.buttonSmall.fontSize, color: Colors.textPrimary },
  aptDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});