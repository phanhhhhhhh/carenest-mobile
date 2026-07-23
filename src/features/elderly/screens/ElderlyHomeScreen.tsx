import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,

  ActivityIndicator,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { getName, getUserId } from '../../../core/storage/secureStorage';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { useMedicationStore } from '../store/medicationStore';
import { useHealthMetricStore } from '../store/healthMetricStore';
import { useCameraStore } from '../../family/store/cameraStore';
import { useAppointmentStore } from '../../family/store/appointmentStore';
import { useEmergencyEventStore } from '../../family/store/emergencyEventStore';
import { useNotificationStore, selectUnreadCount } from '../../notifications/store/notificationStore';
import { showErrorToast } from '../../../shared/components/toastStore';
import type { MedicationItem, AppointmentItem } from '../../../shared/types';



type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDateHeader(): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function formatTimeFromIso(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

export default function ElderlyHomeScreen() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('you');
  const [elderlyId, setElderlyId] = useState<string | null>(null);
  const [sosCountdown, setSosCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const profile = useElderlyProfileStore((s) => s.profile);
  const loadProfile = useElderlyProfileStore((s) => s.load);

  const medItems = useMedicationStore((s) => s.items);
  const medLoading = useMedicationStore((s) => s.isLoading);
  const loadMedications = useMedicationStore((s) => s.load);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  const healthStore = useHealthMetricStore(elderlyId ?? '');
  const latestByType = healthStore((s) => s.latestByType);

  const cameraStatus = useCameraStore((s) => s.status);
  const loadCamera = useCameraStore((s) => s.load);

  const appointments = useAppointmentStore((s) => s.appointments);
  const appointmentsLoading = useAppointmentStore((s) => s.isLoading);
  const loadAppointments = useAppointmentStore((s) => s.load);
  const upcomingAppointments = useAppointmentStore((s) => s.upcoming);

  const createSosEvent = useEmergencyEventStore((s) => s.createSosEvent);

  const notificationItems = useNotificationStore((s) => s.items);
  const loadNotifications = useNotificationStore((s) => s.load);
  const unreadCount = selectUnreadCount(notificationItems);

  useEffect(() => {
    (async () => {
      const storedName = await getName();
      const id = await getUserId();
      setName(storedName ?? 'you');
      setElderlyId(id);
    })();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProfile(controller.signal);
    loadMedications(undefined, controller.signal);
    loadNotifications(controller.signal);
    loadAppointments(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!elderlyId) return;
    const controller = new AbortController();
    healthStore.getState().load(undefined, controller.signal);
    loadCamera(elderlyId, controller.signal);
    return () => controller.abort();
  }, [elderlyId]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const displayName = profile?.name && profile.name.length > 0 ? profile.name : name;

  const onSosPressed = () => {
    setSosCountdown(true);
    setCountdown(3);
    let remaining = 3;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setSosCountdown(false);
        setCountdown(0);
        sendSos();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };

  const cancelSos = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSosCountdown(false);
  };

  const sendSos = async () => {
    if (!elderlyId) {
      Alert.alert('Khẩn cấp', 'Không thể gửi tín hiệu SOS: chưa xác định được tài khoản');
      return;
    }
    try {
      const ok = await createSosEvent(elderlyId);
      if (ok) {
        Alert.alert(
          'Đã gửi SOS',
          'Tín hiệu khẩn cấp đã được gửi. Người thân đã nhận được thông báo.',
        );
      } else {
        Alert.alert(
          'Khẩn cấp',
          'Không thể gửi SOS. Vui lòng gọi trực tiếp cho người thân nếu có việc khẩn cấp!',
        );
      }
    } catch {
      Alert.alert(
        'Khẩn cấp',
        'Không thể gửi SOS. Vui lòng gọi trực tiếp cho người thân nếu có việc khẩn cấp!',
      );
    }
  };

  const sortedMeds = useMemo(() => {
    const items = [...medItems];
    items.sort((a, b) => {
      if (a.taken !== b.taken) return a.taken ? 1 : -1;
      const at = a.nextDoseTime ? new Date(a.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
      const bt = b.nextDoseTime ? new Date(b.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
      return at - bt;
    });
    return items;
  }, [medItems]);

  const nextMed = sortedMeds.length > 0 ? sortedMeds[0] : null;

  const isCameraOn = cameraStatus.hasCamera && cameraStatus.allOnline;

  const bp = latestByType['BLOOD_PRESSURE'];
  const bloodPressure = bp
    ? `${bp.value}${bp.valueSecondary ? `/${bp.valueSecondary}` : ''}${bp.unit ? ` ${bp.unit}` : ''}`
    : undefined;
  const bs = latestByType['BLOOD_GLUCOSE'];
  const bloodSugar = bs ? `${bs.value}${bs.unit ? ` ${bs.unit}` : ''}` : undefined;
  const hr = latestByType['HEART_RATE'];
  const heartRate = hr ? `${hr.value}${hr.unit ? ` ${hr.unit}` : ''}` : undefined;

  const upcoming = upcomingAppointments().slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{`${greeting()}, ${displayName}!`}</Text>
            <Text style={styles.dateText}>{formatDateHeader()}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View>
              <Ionicons name="notifications-outline" size={26} color={Colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />

        <View style={styles.sosWrap}>
          {sosCountdown ? (
            <>
              <Text style={styles.sosSendingText}>Đang gửi tín hiệu khẩn cấp...</Text>
              <View style={{ height: 16 }} />
              <View style={styles.sosRing}>
                <Text style={styles.sosCountdownNumber}>{countdown}</Text>
              </View>
              <View style={{ height: 16 }} />
              <TouchableOpacity onPress={cancelSos} style={styles.cancelBtn}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={onSosPressed} activeOpacity={0.85} style={styles.sosCircle}>
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSubText}>Cảnh báo khẩn cấp</Text>
              </TouchableOpacity>
              <View style={{ height: 14 }} />
              <Text style={styles.sosHint}>Nhấn giữ 3 giây để gửi tín hiệu khẩn cấp</Text>
            </>
          )}
        </View>

        <View style={{ height: 24 }} />

        {nextMed && (
          <NextMedicationCard
            medication={nextMed}
            onToggleTaken={(id) => toggleTaken(id, showErrorToast)}
          />
        )}

        <View style={{ height: 20 }} />

        {elderlyId && (
          <View style={styles.cameraCard}>
            <View style={[styles.cameraDot, { backgroundColor: isCameraOn ? Colors.success : Colors.textHint }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cameraTitle}>{isCameraOn ? 'Camera đang bật' : 'Camera chưa bật'}</Text>
              <Text style={styles.cameraSubtitle}>{isCameraOn ? 'Con đang xem được' : 'Chưa có ai theo dõi'}</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => navigation.navigate('ElderlyEmergencyContacts')}
            >
              <Ionicons name="call" size={16} color={Colors.primary} />
              <Text style={styles.callButtonText}>Gọi cho con</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />

        <TouchableOpacity
          style={styles.chatCard}
          onPress={() => navigation.navigate('ElderlyChat')}
          activeOpacity={0.85}
        >
          <View style={styles.chatIcon}>
            <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cameraTitle}>Trò chuyện với AI</Text>
            <Text style={styles.cameraSubtitle}>Hỏi đáp, nhắc nhở và trò chuyện hằng ngày</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
        </TouchableOpacity>

        <View style={{ height: 28 }} />

        <Text style={styles.sectionTitle}>Chỉ số hôm nay</Text>
        <View style={{ height: 14 }} />
        <View style={styles.healthRow}>
          <HealthCard
            icon="heart"
            iconBgColor="#FFEBEE"
            iconColor={Colors.error}
            label="Nhịp tim"
            value={heartRate ?? '--'}
          />
          <View style={{ width: 10 }} />
          <HealthCard
            icon="water"
            iconBgColor="#E3F2FD"
            iconColor="#1565C0"
            label="Huyết áp"
            value={bloodPressure ?? '--'}
          />
          <View style={{ width: 10 }} />
          <HealthCard
            icon="flask-outline"
            iconBgColor="#FFF3E0"
            iconColor={Colors.warning}
            label="Đường huyết"
            value={bloodSugar ?? '--'}
          />
        </View>

        <View style={{ height: 28 }} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
          {medItems.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('ElderlyShell', { screen: 'ElderlyMeds' })}>
              <Text style={styles.viewAll}>Xem tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 14 }} />
        {medLoading ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : medItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={36} color={Colors.textHint} />
            <Text style={styles.emptyText}>Chưa có thuốc nào</Text>
          </View>
        ) : (
          medItems.slice(0, 3).map((med) => <MedicationTile key={med.id} medication={med} />)
        )}

        <View style={{ height: 28 }} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch hẹn sắp tới</Text>
          {upcoming.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('ElderlyAppointments')}>
              <Text style={styles.viewAll}>Xem tất cả</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 14 }} />
        {appointmentsLoading && upcoming.length === 0 ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : upcoming.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCardBig}
            onPress={() => navigation.navigate('ElderlyAppointments')}
          >
            <Ionicons name="calendar-outline" size={32} color={Colors.textHint} />
            <Text style={styles.emptyTextSmall}>Chưa có lịch hẹn</Text>
          </TouchableOpacity>
        ) : (
          upcoming.map((apt) => (
            <AppointmentTile
              key={apt.id}
              appointment={apt}
              onPress={() => navigation.navigate('ElderlyAppointments')}
            />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function NextMedicationCard({
  medication,
  onToggleTaken,
}: {
  medication: MedicationItem;
  onToggleTaken: (id: string) => void;
}) {
  const timeLabel = medication.nextDoseTime
    ? formatTimeFromIso(medication.nextDoseTime)
    : medication.scheduleTimes.length > 0
      ? medication.scheduleTimes[0]
      : '';

  return (
    <View
      style={[
        styles.nextMedCard,
        {
          borderColor: medication.taken ? 'rgba(67, 160, 71, 0.3)' : 'rgba(255, 167, 38, 0.4)',
        },
      ]}
    >
      <View
        style={[
          styles.nextMedIcon,
          { backgroundColor: medication.taken ? 'rgba(67, 160, 71, 0.1)' : 'rgba(255, 167, 38, 0.1)' },
        ]}
      >
        <Ionicons name="medkit" size={26} color={medication.taken ? Colors.success : Colors.warning} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.nextMedLabel}>
          {timeLabel ? `Thuốc tiếp theo · ${timeLabel}` : 'Thuốc tiếp theo'}
        </Text>
        <Text style={styles.nextMedName}>
          {medication.name} {medication.dosage}
        </Text>
      </View>
      <TouchableOpacity
        disabled={medication.taken}
        onPress={() => onToggleTaken(medication.id)}
        style={[styles.takeBtn, { backgroundColor: medication.taken ? Colors.textHint : Colors.success }]}
      >
        <Text style={styles.takeBtnText}>{medication.taken ? 'Đã uống ✓' : 'ĐÃ UỐNG'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function HealthCard({
  icon,
  iconBgColor,
  iconColor,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBgColor: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.healthCard}>
      <View style={[styles.healthIconWrap, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ height: 10 }} />
      <Text style={styles.healthValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.healthLabel}>{label}</Text>
    </View>
  );
}

function MedicationTile({ medication }: { medication: MedicationItem }) {
  const timeLabel = formatTimeFromIso(medication.nextDoseTime);
  return (
    <View style={styles.medTile}>
      <View style={styles.medTileIcon}>
        <Ionicons name="medkit" size={24} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.medTileName}>{medication.name}</Text>
        <Text style={styles.medTileDosage}>{medication.dosage}</Text>
      </View>
      {!!timeLabel && (
        <View style={styles.medTileTimeBadge}>
          <Text style={styles.medTileTimeText}>{timeLabel}</Text>
        </View>
      )}
      <View style={{ width: 10 }} />
      <View
        style={[
          styles.medTileCheck,
          {
            borderColor: medication.taken ? Colors.success : 'rgba(173, 181, 189, 0.5)',
            backgroundColor: medication.taken ? 'rgba(67, 160, 71, 0.1)' : 'transparent',
          },
        ]}
      >
        {medication.taken && <Ionicons name="checkmark" size={14} color={Colors.success} />}
      </View>
    </View>
  );
}

function AppointmentTile({
  appointment,
  onPress,
}: {
  appointment: AppointmentItem;
  onPress: () => void;
}) {
  const date = new Date(appointment.appointmentDate);
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return (
    <TouchableOpacity style={styles.aptTile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.aptDateBox}>
        <Text style={styles.aptDateDay}>{date.getDate()}</Text>
        <Text style={styles.aptDateMonth}>{MONTHS[date.getMonth()]}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.aptDoctor}>{appointment.doctor}</Text>
        <Text style={styles.aptDetail}>
          {appointment.specialty} • {timeStr}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  greeting: { fontSize: Typography.h2.fontSize, fontWeight: '700', color: Colors.textPrimary },
  dateText: { marginTop: 4, color: Colors.textSecondary, fontSize: Typography.buttonSmall.fontSize },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: Typography.badge.fontSize, fontWeight: '700' },

  sosWrap: { alignItems: 'center' },
  sosSendingText: { fontSize: Typography.button.fontSize, fontWeight: '600', color: Colors.sosPrimary },
  sosRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: Colors.sosLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  sosCountdownNumber: { fontSize: 48, fontWeight: '700', color: Colors.sosPrimary },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  cancelText: { fontSize: Typography.button.fontSize, color: Colors.textSecondary },
  sosCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.sosPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.sosPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  sosText: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: 4 },
  sosSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  sosHint: { color: Colors.textSecondary, fontSize: Typography.bodySmall.fontSize, textAlign: 'center' },

  nextMedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
  },
  nextMedIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nextMedLabel: { fontSize: 12, color: Colors.textSecondary },
  nextMedName: { marginTop: 2, fontSize: Typography.cardTitle.fontSize, fontWeight: '700', color: Colors.textPrimary },
  takeBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginLeft: 8 },
  takeBtnText: { color: '#FFFFFF', fontSize: Typography.bodySmall.fontSize, fontWeight: '700' },

  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  cameraDot: { width: 12, height: 12, borderRadius: 6 },
  cameraTitle: { fontSize: Typography.buttonSmall.fontSize, fontWeight: '600', color: Colors.textPrimary },
  cameraSubtitle: { fontSize: 12, color: Colors.textSecondary },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 154, 0.4)',
  },
  callButtonText: { color: Colors.primary, fontSize: Typography.bodySmall.fontSize, fontWeight: '600' },

  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 125, 154, 0.1)',
  },

  sectionTitle: { fontSize: Typography.sectionTitle.fontSize, fontWeight: '700', color: Colors.textPrimary },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: Colors.primary, fontSize: Typography.buttonSmall.fontSize, fontWeight: '600' },

  healthRow: { flexDirection: 'row' },
  healthCard: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  healthIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  healthValue: { fontSize: Typography.cardTitle.fontSize, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  healthLabel: { marginTop: 2, fontSize: Typography.caption.fontSize, color: Colors.textSecondary, textAlign: 'center' },

  centerPad: { alignItems: 'center', paddingVertical: 16 },
  emptyCard: {
    width: '100%',
    paddingVertical: Spacing.xxl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyCardBig: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: { marginTop: 8, color: Colors.textSecondary, fontSize: Typography.buttonSmall.fontSize },
  emptyTextSmall: { marginTop: 8, color: Colors.textSecondary, fontSize: Typography.bodySmall.fontSize },

  medTile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.2)',
  },
  medTileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTileName: { fontWeight: '600', color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  medTileDosage: { marginTop: 2, color: Colors.textSecondary, fontSize: Typography.bodySmall.fontSize },
  medTileTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
  },
  medTileTimeText: { color: Colors.primary, fontSize: Typography.bodySmall.fontSize, fontWeight: '600' },
  medTileCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aptTile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    padding: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  aptDateBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptDateDay: { fontWeight: '700', fontSize: Typography.cardTitle.fontSize, color: Colors.primary },
  aptDateMonth: { fontSize: 10, color: Colors.primary },
  aptDoctor: { fontWeight: '600', fontSize: Typography.buttonSmall.fontSize, color: Colors.textPrimary },
  aptDetail: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
});
