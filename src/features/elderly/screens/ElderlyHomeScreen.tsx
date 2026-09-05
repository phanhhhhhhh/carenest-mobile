import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { Shadows } from '../../../core/theme/spacing';
import { getName, getUserId } from '../../../core/storage/secureStorage';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { useMedicationStore } from '../store/medicationStore';
import { useCameraStore } from '../../family/store/cameraStore';
import { useEmergencyEventStore } from '../../family/store/emergencyEventStore';
import { useCheckInStore, selectTodayCheckIn } from '../store/checkinStore';
import {
  useNotificationStore,
  selectUnreadCount,
} from '../../notifications/store/notificationStore';
import { showErrorToast } from '../../../shared/components/toastStore';
import { formatDateHeader, greeting } from './elderlyHome/utils';
import { MedicationTile, NextMedicationCard } from './elderlyHome/MedicationCards';
import { SosPanel, useSosCountdown } from './elderlyHome/SosPanel';
import { CheckinPanel } from './elderlyHome/CheckinPanel';
import type { CheckInMood } from '../../../shared/types';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyHomeScreen() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('Bác');
  const [elderlyId, setElderlyId] = useState<string | null>(null);

  const profile = useElderlyProfileStore((s) => s.profile);
  const loadProfile = useElderlyProfileStore((s) => s.load);

  const medItems = useMedicationStore((s) => s.items);
  const medLoading = useMedicationStore((s) => s.isLoading);
  const loadMedications = useMedicationStore((s) => s.load);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  const cameraStatus = useCameraStore((s) => s.status);
  const loadCamera = useCameraStore((s) => s.load);

  const createSosEvent = useEmergencyEventStore((s) => s.createSosEvent);

  const todayCheckIn = useCheckInStore((s) => selectTodayCheckIn(s, elderlyId));
  const checkInSubmitting = useCheckInStore((s) => s.submitting);
  const loadTodayCheckIn = useCheckInStore((s) => s.loadToday);
  const submitCheckIn = useCheckInStore((s) => s.submit);

  const notificationItems = useNotificationStore((s) => s.items);
  const loadNotifications = useNotificationStore((s) => s.load);
  const unreadCount = selectUnreadCount(notificationItems);

  useEffect(() => {
    (async () => {
      const storedName = await getName();
      const id = await getUserId();
      setName(storedName ?? 'Bác');
      setElderlyId(id);
    })();
  }, []);

  useMountEffect(() => {
    const controller = new AbortController();
    loadProfile(controller.signal);
    loadMedications(undefined, controller.signal);
    loadNotifications(controller.signal);
    return () => controller.abort();
  });

  useEffect(() => {
    if (!elderlyId) return;
    const controller = new AbortController();
    loadCamera(elderlyId, controller.signal);
    loadTodayCheckIn(elderlyId, controller.signal);
    return () => controller.abort();
  }, [elderlyId, loadCamera, loadTodayCheckIn]);

  const displayName = profile?.name && profile.name.length > 0 ? profile.name : name;

  const sendSos = async () => {
    if (!elderlyId) {
      Alert.alert('Khẩn cấp', 'Không thể gửi tín hiệu SOS: chưa xác định được tài khoản');
      return;
    }
    try {
      const ok = await createSosEvent(elderlyId);
      if (ok) {
        Alert.alert(
          'ĐÃ PHÁT TÍN HIỆU SOS',
          'Tín hiệu khẩn cấp đã được gửi thành công. Người thân đã nhận được thông báo.',
        );
      } else {
        Alert.alert(
          'Khẩn cấp',
          'Không thể gửi SOS tự động. Vui lòng bấm gọi trực tiếp cho người thân!',
        );
      }
    } catch {
      Alert.alert(
        'Khẩn cấp',
        'Không thể gửi SOS tự động. Vui lòng bấm gọi trực tiếp cho người thân!',
      );
    }
  };

  const sos = useSosCountdown(sendSos);

  const handleSelectMood = async (mood: CheckInMood) => {
    if (!elderlyId) return;
    const ok = await submitCheckIn(elderlyId, mood);
    if (!ok) {
      showErrorToast('Không gửi được trạng thái. Vui lòng thử lại.');
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Greeting Card */}
        <View style={styles.headerCard}>
          <Image
            source={require('../../../../assets/mascot/mascot_nurse.jpg')}
            style={styles.greetingMascot}
            resizeMode="contain"
          />
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.greeting}>{`${greeting()},`}</Text>
            <Text style={styles.greetingName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color="#64748B"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.dateText}>{formatDateHeader()}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 18 }} />

        {/* Daily 1-Touch Check-in (UC A1) */}
        <CheckinPanel
          today={todayCheckIn}
          submitting={checkInSubmitting}
          onSelectMood={handleSelectMood}
          onSos={sos.start}
        />

        <View style={{ height: 18 }} />

        {/* SOS Panel */}
        <SosPanel
          countingDown={sos.active}
          count={sos.count}
          onPress={sos.start}
          onCancel={sos.cancel}
        />

        <View style={{ height: 18 }} />

        {/* AI Assistant Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => navigation.navigate('ElderlyChat')}
          activeOpacity={0.88}
        >
          <View style={styles.aiIconBox}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.aiBannerTitle}>Trò chuyện với CareNest AI</Text>
            <Text style={styles.aiBannerSubtitle}>Hỏi đáp sức khỏe & nhắc nhở giọng nói</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#4F46E5" />
        </TouchableOpacity>

        <View style={{ height: 18 }} />

        {/* Next Medication Dose Card */}
        {nextMed && (
          <>
            <NextMedicationCard
              medication={nextMed}
              onToggleTaken={(id) => toggleTaken(id, showErrorToast)}
            />
            <View style={{ height: 18 }} />
          </>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.quickGrid}>
          {/* Direct Call to Family */}
          <TouchableOpacity
            style={styles.callCard}
            onPress={() => navigation.navigate('ElderlyEmergencyContacts')}
            activeOpacity={0.85}
          >
            <View style={styles.callIconBox}>
              <Ionicons name="call" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.callCardText}>Gọi người thân</Text>
              <Text style={styles.callCardSubtext}>Bấm để liên lạc nhanh với gia đình</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#047857" />
          </TouchableOpacity>

          {/* Quick Health Track and Camera Row */}
          <View style={styles.twoColumnGrid}>
            <TouchableOpacity
              style={styles.miniCard}
              onPress={() => navigation.navigate('ElderlyHealth')}
              activeOpacity={0.85}
            >
              <View style={[styles.miniIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="heart-circle" size={24} color="#0284C7" />
              </View>
              <Text style={styles.miniCardTitle}>Đo sức khỏe</Text>
              <Text style={styles.miniCardSub}>Huyết áp, đường huyết</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.miniCard}
              onPress={() => navigation.navigate('ElderlyShell', { screen: 'ElderlyCamera' })}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.miniIconBox,
                  { backgroundColor: isCameraOn ? '#DCFCE7' : '#F1F5F9' },
                ]}
              >
                <Ionicons name="videocam" size={24} color={isCameraOn ? '#16A34A' : '#64748B'} />
              </View>
              <Text style={styles.miniCardTitle}>
                {isCameraOn ? 'Camera online' : 'Camera chờ'}
              </Text>
              <Text style={styles.miniCardSub}>
                {isCameraOn ? 'Con đang quan sát' : 'Nhấn để xem'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />

        {/* Today's Medications List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch uống thuốc hôm nay</Text>
          {medItems.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ElderlyShell', { screen: 'ElderlyMeds' })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewAll}>Xem tất cả ({medItems.length}) →</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 12 }} />
        {medLoading ? (
          <View style={styles.centerPad}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : medItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Image
              source={require('../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
              style={{ width: 80, height: 80, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Hôm nay không có thuốc cần uống</Text>
            <Text style={styles.emptyText}>Chúc Bác một ngày thật nhiều sức khỏe và niềm vui!</Text>
          </View>
        ) : (
          medItems.slice(0, 3).map((med) => <MedicationTile key={med.id} medication={med} />)
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20 },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
  },
  greetingMascot: { width: 62, height: 62, marginRight: 14 },
  greeting: { fontSize: 13.5, color: '#64748B', fontWeight: '600' },
  greetingName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '500',
  },
  notifButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aiIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  aiBannerSubtitle: {
    fontSize: 13,
    color: '#4338CA',
    marginTop: 2,
  },

  quickGrid: { gap: 12 },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  callIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  callCardText: {
    color: '#065F46',
    fontSize: 16.5,
    fontWeight: '800',
  },
  callCardSubtext: {
    color: '#047857',
    fontSize: 13,
    marginTop: 2,
  },

  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  miniIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  miniCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  miniCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: { color: Colors.primary, fontSize: 14, fontWeight: '700' },

  centerPad: { alignItems: 'center', paddingVertical: 20 },
  emptyCard: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13.5,
    textAlign: 'center',
  },
});
