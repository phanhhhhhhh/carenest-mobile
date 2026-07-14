import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { getName, getUserId } from '../../../core/storage/secureStorage';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { useMedicationStore } from '../store/medicationStore';
import { useHealthMetricStore } from '../store/healthMetricStore';
import { useCameraStore } from '../../family/store/cameraStore';
import { useAppointmentStore } from '../../family/store/appointmentStore';
import { useEmergencyEventStore } from '../../family/store/emergencyEventStore';
import { useNotificationStore, selectUnreadCount } from '../../notifications/store/notificationStore';
import type { MedicationItem, AppointmentItem } from '../../../shared/types';

/**
 * Port of Flutter's elderly_home_screen.dart.
 *
 * Notes on fidelity:
 * - The Flutter "SOS Sent" confirmation used a custom rounded AlertDialog
 *   with a large check-circle icon. This codebase's house style (see
 *   ElderlyEditProfileScreen) uses RN's built-in `Alert.alert` for all
 *   confirmation/snackbar-equivalent messaging, so the same convention is
 *   used here instead of a bespoke Modal.
 * - The Flutter SOS button showed a true circular countdown progress ring
 *   (`CircularProgressIndicator`). No chart/SVG library is available here,
 *   so the countdown ring is approximated with a plain bordered circle;
 *   the countdown number and cancel behavior are otherwise identical.
 * - "View all" on Today's Medications navigates to the medication tab
 *   (`ElderlyMeds`), the direct RN equivalent of Flutter's
 *   `context.go('/elderly/medication')` route.
 */

type Nav = NativeStackNavigationProp<any>;

function formatDateHeader(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeFromIso(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const healthState = useHealthMetricStore(elderlyId ?? '');

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
    loadProfile();
    loadMedications();
    loadNotifications();
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (elderlyId) {
      healthState.load();
      loadCamera(elderlyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      Alert.alert('Emergency', 'Unable to send SOS: account not identified');
      return;
    }
    try {
      const ok = await createSosEvent(elderlyId);
      if (ok) {
        Alert.alert(
          'SOS Sent',
          'Emergency signal has been sent. All family members have been notified.',
        );
      } else {
        Alert.alert(
          'Emergency',
          'Cannot send SOS. Please call your family directly in case of emergency!',
        );
      }
    } catch {
      Alert.alert(
        'Emergency',
        'Cannot send SOS. Please call your family directly in case of emergency!',
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

  const bp = healthState.latestByType['BLOOD_PRESSURE'];
  const bloodPressure = bp
    ? `${bp.value}${bp.valueSecondary ? `/${bp.valueSecondary}` : ''}${bp.unit ? ` ${bp.unit}` : ''}`
    : undefined;
  const bs = healthState.latestByType['BLOOD_GLUCOSE'];
  const bloodSugar = bs ? `${bs.value}${bs.unit ? ` ${bs.unit}` : ''}` : undefined;
  const hr = healthState.latestByType['HEART_RATE'];
  const heartRate = hr ? `${hr.value}${hr.unit ? ` ${hr.unit}` : ''}` : undefined;

  const upcoming = upcomingAppointments().slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{`${greeting()}, ${displayName}!`}</Text>
            <Text style={styles.dateText}>{formatDateHeader()}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications' as never)}>
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

        {/* SOS button */}
        <View style={styles.sosWrap}>
          {sosCountdown ? (
            <>
              <Text style={styles.sosSendingText}>Sending emergency signal...</Text>
              <View style={{ height: 16 }} />
              <View style={styles.sosRing}>
                <Text style={styles.sosCountdownNumber}>{countdown}</Text>
              </View>
              <View style={{ height: 16 }} />
              <TouchableOpacity onPress={cancelSos} style={styles.cancelBtn}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={onSosPressed} activeOpacity={0.85} style={styles.sosCircle}>
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSubText}>Emergency Alert</Text>
              </TouchableOpacity>
              <View style={{ height: 14 }} />
              <Text style={styles.sosHint}>Press and hold 3 seconds to send emergency signal</Text>
            </>
          )}
        </View>

        <View style={{ height: 24 }} />

        {/* Next medication card */}
        {nextMed && <NextMedicationCard medication={nextMed} onToggleTaken={toggleTaken} />}

        <View style={{ height: 20 }} />

        {/* Camera status card */}
        {elderlyId && (
          <View style={styles.cameraCard}>
            <View style={[styles.cameraDot, { backgroundColor: isCameraOn ? Colors.success : Colors.textHint }]} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cameraTitle}>{isCameraOn ? 'Camera đang bật' : 'Camera chưa bật'}</Text>
              <Text style={styles.cameraSubtitle}>{isCameraOn ? 'Con đang xem được' : 'Chưa có ai theo dõi'}</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => navigation.navigate('ElderlyEmergencyContacts' as never)}
            >
              <Ionicons name="call" size={16} color={Colors.primary} />
              <Text style={styles.callButtonText}>Gọi cho con</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 28 }} />

        {/* Health summary */}
        <Text style={styles.sectionTitle}>Today's Readings</Text>
        <View style={{ height: 14 }} />
        <View style={styles.healthRow}>
          <HealthCard
            icon="heart"
            iconBgColor="#FFEBEE"
            iconColor={Colors.error}
            label="Heart Rate"
            value={heartRate ?? '--'}
          />
          <View style={{ width: 10 }} />
          <HealthCard
            icon="water"
            iconBgColor="#E3F2FD"
            iconColor="#1565C0"
            label="Blood Pressure"
            value={bloodPressure ?? '--'}
          />
          <View style={{ width: 10 }} />
          <HealthCard
            icon="flask-outline"
            iconBgColor="#FFF3E0"
            iconColor={Colors.warning}
            label="Blood Sugar"
            value={bloodSugar ?? '--'}
          />
        </View>

        <View style={{ height: 28 }} />

        {/* Today's medications */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Medications</Text>
          {medItems.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('ElderlyMeds' as never)}>
              <Text style={styles.viewAll}>View all</Text>
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
            <Text style={styles.emptyText}>No medications yet</Text>
          </View>
        ) : (
          medItems.slice(0, 3).map((med) => <MedicationTile key={med.id} medication={med} />)
        )}

        <View style={{ height: 28 }} />

        {/* Upcoming appointments */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {upcoming.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('ElderlyAppointments' as never)}>
              <Text style={styles.viewAll}>View all</Text>
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
            onPress={() => navigation.navigate('ElderlyAppointments' as never)}
          >
            <Ionicons name="calendar-outline" size={32} color={Colors.textHint} />
            <Text style={styles.emptyTextSmall}>No appointments</Text>
          </TouchableOpacity>
        ) : (
          upcoming.map((apt) => (
            <AppointmentTile
              key={apt.id}
              appointment={apt}
              onPress={() => navigation.navigate('ElderlyAppointments' as never)}
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
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  dateText: { marginTop: 4, color: Colors.textSecondary, fontSize: 14 },
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
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  sosWrap: { alignItems: 'center' },
  sosSendingText: { fontSize: 16, fontWeight: '600', color: Colors.sosPrimary },
  sosRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: Colors.sosLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sosCountdownNumber: { fontSize: 48, fontWeight: '700', color: Colors.sosPrimary },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  cancelText: { fontSize: 16, color: Colors.textSecondary },
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
  sosHint: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },

  nextMedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
  },
  nextMedIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nextMedLabel: { fontSize: 12, color: Colors.textSecondary },
  nextMedName: { marginTop: 2, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  takeBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginLeft: 8 },
  takeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  cameraDot: { width: 12, height: 12, borderRadius: 6 },
  cameraTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
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
  callButtonText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  healthRow: { flexDirection: 'row' },
  healthCard: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  healthIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  healthValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  healthLabel: { marginTop: 2, fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  centerPad: { alignItems: 'center', paddingVertical: 16 },
  emptyCard: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyCardBig: {
    width: '100%',
    padding: 20,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: { marginTop: 8, color: Colors.textSecondary, fontSize: 14 },
  emptyTextSmall: { marginTop: 8, color: Colors.textSecondary, fontSize: 13 },

  medTile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
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
  medTileName: { fontWeight: '600', color: Colors.textPrimary, fontSize: 15 },
  medTileDosage: { marginTop: 2, color: Colors.textSecondary, fontSize: 13 },
  medTileTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(46, 125, 154, 0.08)',
  },
  medTileTimeText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
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
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
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
  aptDateDay: { fontWeight: '700', fontSize: 16, color: Colors.primary },
  aptDateMonth: { fontSize: 10, color: Colors.primary },
  aptDoctor: { fontWeight: '600', fontSize: 14, color: Colors.textPrimary },
  aptDetail: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
});
