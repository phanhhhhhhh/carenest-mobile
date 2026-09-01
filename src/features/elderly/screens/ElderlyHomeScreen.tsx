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
import {
  useNotificationStore,
  selectUnreadCount,
} from '../../notifications/store/notificationStore';
import { showErrorToast } from '../../../shared/components/toastStore';
import { formatDateHeader, greeting } from './elderlyHome/utils';
import { MedicationTile, NextMedicationCard } from './elderlyHome/MedicationCards';
import { SosPanel, useSosCountdown } from './elderlyHome/SosPanel';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyHomeScreen() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('you');
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
    return () => controller.abort();
  }, [elderlyId, loadCamera]);

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

  const sos = useSosCountdown(sendSos);

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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <Image
            source={require('../../../../assets/mascot/mascot_nurse.jpg')}
            style={styles.greetingMascot}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{`${greeting()},`}</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
            <Text style={styles.dateText}>{formatDateHeader()}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />

        {/* SOS Panel */}
        <SosPanel
          countingDown={sos.active}
          count={sos.count}
          onPress={sos.start}
          onCancel={sos.cancel}
        />

        <View style={{ height: 20 }} />

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
          <Ionicons name="chevron-forward" size={20} color={Colors.aiPrimary} />
        </TouchableOpacity>

        <View style={{ height: 18 }} />

        {nextMed && (
          <>
            <NextMedicationCard
              medication={nextMed}
              onToggleTaken={(id) => toggleTaken(id, showErrorToast)}
            />
            <View style={{ height: 18 }} />
          </>
        )}

        {elderlyId && (
          <View style={styles.quickGrid}>
            <View style={styles.cameraCard}>
              <View
                style={[
                  styles.cameraDot,
                  { backgroundColor: isCameraOn ? Colors.success : Colors.textHint },
                ]}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cameraTitle}>
                  {isCameraOn ? 'Camera trực tuyến' : 'Camera chờ kết nối'}
                </Text>
                <Text style={styles.cameraSubtitle}>
                  {isCameraOn ? 'Con đang quan sát' : 'Chưa có người xem'}
                </Text>
              </View>
              <Ionicons
                name="videocam"
                size={24}
                color={isCameraOn ? Colors.primary : Colors.textHint}
              />
            </View>

            <TouchableOpacity
              style={styles.callCard}
              onPress={() => navigation.navigate('ElderlyEmergencyContacts')}
              activeOpacity={0.85}
            >
              <View style={styles.callIconBox}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.callCardText}>Gọi người thân</Text>
                <Text style={styles.callCardSubtext}>Liên lạc nhanh với gia đình</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.secondaryDark} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
          {medItems.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ElderlyShell', { screen: 'ElderlyMeds' })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewAll}>Xem tất cả →</Text>
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
            <Ionicons name="medkit-outline" size={36} color={Colors.textHint} />
            <Text style={styles.emptyText}>Chưa có lịch uống thuốc nào hôm nay</Text>
          </View>
        ) : (
          medItems.slice(0, 3).map((med) => <MedicationTile key={med.id} medication={med} />)
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
  greetingMascot: { width: 58, height: 58, marginRight: 14 },
  greeting: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  greetingName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  dateText: {
    marginTop: 3,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
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
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.aiLighter,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    shadowColor: Colors.aiPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  aiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.aiPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#312E81',
  },
  aiBannerSubtitle: {
    fontSize: 12.5,
    color: '#4338CA',
    marginTop: 2,
  },

  quickGrid: { gap: 12 },
  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cameraDot: { width: 10, height: 10, borderRadius: 5 },
  cameraTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cameraSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.secondaryLighter,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  callIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  callCardText: {
    color: Colors.secondaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  callCardSubtext: {
    color: '#065F46',
    fontSize: 12,
    marginTop: 1,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: Colors.primary, fontSize: 13.5, fontWeight: '700' },

  centerPad: { alignItems: 'center', paddingVertical: 20 },
  emptyCard: {
    width: '100%',
    paddingVertical: 32,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 13.5,
  },
});
