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
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
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
        <View style={styles.headerRow}>
          <Image
            source={require('../../../../assets/mascot/mascot_nurse.jpg')}
            style={styles.greetingMascot}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{`${greeting()},`}</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
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
        <Text style={styles.dateText}>{formatDateHeader()}</Text>

        <View style={{ height: 24 }} />

        <SosPanel
          countingDown={sos.active}
          count={sos.count}
          onPress={sos.start}
          onCancel={sos.cancel}
        />

        <View style={{ height: 20 }} />

        {nextMed && (
          <NextMedicationCard
            medication={nextMed}
            onToggleTaken={(id) => toggleTaken(id, showErrorToast)}
          />
        )}

        <View style={{ height: 16 }} />

        {elderlyId && (
          <>
            <View style={styles.cameraCard}>
              <View
                style={[
                  styles.cameraDot,
                  { backgroundColor: isCameraOn ? Colors.success : Colors.textHint },
                ]}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cameraTitle}>
                  {isCameraOn ? 'Camera đang bật' : 'Camera chưa bật'}
                </Text>
                <Text style={styles.cameraSubtitle}>
                  {isCameraOn ? 'Con đang xem được' : 'Chưa có ai theo dõi'}
                </Text>
              </View>
              <Ionicons name="videocam-outline" size={24} color={Colors.textPrimary} />
            </View>

            <View style={{ height: 12 }} />

            <TouchableOpacity
              style={styles.callCard}
              onPress={() => navigation.navigate('ElderlyEmergencyContacts')}
              activeOpacity={0.85}
            >
              <Ionicons name="call-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.callCardText}>Gọi cho con</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 28 }} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Thuốc hôm nay</Text>
          {medItems.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ElderlyShell', { screen: 'ElderlyMeds' })}
            >
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

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  greetingMascot: { width: 56, height: 56, marginRight: 10 },
  greeting: { fontSize: Typography.buttonSmall.fontSize, color: Colors.textSecondary },
  greetingName: {
    marginTop: 2,
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateText: {
    marginTop: 6,
    color: Colors.textSecondary,
    fontSize: Typography.buttonSmall.fontSize,
  },
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

  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cameraDot: { width: 12, height: 12, borderRadius: 6 },
  cameraTitle: {
    fontSize: Typography.buttonSmall.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cameraSubtitle: { fontSize: 12, color: Colors.textSecondary },

  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  callCardText: {
    color: Colors.textPrimary,
    fontSize: Typography.buttonSmall.fontSize,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { color: Colors.primary, fontSize: Typography.buttonSmall.fontSize, fontWeight: '600' },

  centerPad: { alignItems: 'center', paddingVertical: 16 },
  emptyCard: {
    width: '100%',
    paddingVertical: Spacing.xxl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: Typography.buttonSmall.fontSize,
  },
});
