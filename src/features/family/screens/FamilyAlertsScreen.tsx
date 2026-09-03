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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useEmergencyEventStore } from '../store/emergencyEventStore';
import { AlertsHeader } from './familyAlerts/AlertsHeader';
import { AlertCard } from './familyAlerts/AlertCard';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function FamilyAlertsScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);

  const events = useEmergencyEventStore((s) => s.events);
  const isLoading = useEmergencyEventStore((s) => s.isLoading);
  const error = useEmergencyEventStore((s) => s.error);
  const load = useEmergencyEventStore((s) => s.load);
  const acknowledge = useEmergencyEventStore((s) => s.acknowledge);
  const markAllRead = useEmergencyEventStore((s) => s.markAllRead);
  const logEmergencyCall = useEmergencyEventStore((s) => s.logEmergencyCall);

  const [markingRead, setMarkingRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);

  const elderlyId =
    dashboardData && dashboardData.linkedElderly.length > 0
      ? (dashboardData.linkedElderly[dashboardData.selectedIndex]?.elderlyId ?? null)
      : null;

  useMountEffect(() => {
    loadDashboard();
  });

  useEffect(() => {
    if (elderlyId) load(elderlyId);
  }, [elderlyId, load]);

  const activeCount = events.filter((e) => e.status === 'ACTIVE').length;

  const handleMarkAllRead = async () => {
    if (!elderlyId || !user?.id) return;
    setMarkingRead(true);
    await markAllRead(elderlyId, String(user.id));
    setMarkingRead(false);
  };

  const handleAcknowledge = async (eventId: string) => {
    if (!elderlyId) return;
    setAcknowledgingId(eventId);
    await acknowledge(elderlyId, eventId);
    setAcknowledgingId(null);
  };

  const handleRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  const handleCallEmergencyServices = async (eventId: string) => {
    if (!elderlyId) return;
    setCallingId(eventId);
    try {
      await logEmergencyCall(elderlyId, eventId);
      await Linking.openURL('tel:115');
    } catch (e) {
      console.warn('[FamilyAlertsScreen] Emergency call error', e);
    } finally {
      setCallingId(null);
    }
  };

  if (!elderlyId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <AlertsHeader
          activeCount={0}
          marking={false}
          onMarkAllRead={() => {}}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={{ width: 140, height: 140, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.noElderlyText}>Chưa liên kết người thân nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AlertsHeader
        activeCount={activeCount}
        marking={markingRead}
        onMarkAllRead={handleMarkAllRead}
        onBack={() => navigation.goBack()}
      />
      {renderBody()}
    </SafeAreaView>
  );

  function renderBody() {
    if (isLoading && events.length === 0) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải danh sách cảnh báo...</Text>
        </View>
      );
    }

    if (error && events.length === 0) {
      return (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
          <View style={{ height: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ height: 16 }} />
          <TouchableOpacity style={styles.retryButton} onPress={() => elderlyId && load(elderlyId)}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (events.length === 0) {
      return (
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_thumbsup.jpg')}
            style={{ width: 140, height: 140, marginBottom: 8 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Mọi thứ đều bình an</Text>
          <Text style={styles.emptySubtitle}>
            Không có cảnh báo hay sự cố khẩn cấp nào gần đây.
          </Text>
        </View>
      );
    }

    const active = events.filter((e) => e.status === 'ACTIVE');
    const resolved = events.filter((e) => e.status !== 'ACTIVE');

    return (
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {active.length > 0 && (
          <>
            <Text style={styles.sectionTitleActive}>Đang hoạt động ({active.length})</Text>
            {active.map((event) => (
              <AlertCard
                key={event.id}
                event={event}
                acknowledging={acknowledgingId === event.id}
                onAcknowledge={handleAcknowledge}
                calling={callingId === event.id}
                onCallEmergencyServices={handleCallEmergencyServices}
              />
            ))}
          </>
        )}
        {resolved.length > 0 && (
          <>
            {active.length > 0 && <View style={{ height: 14 }} />}
            <Text style={styles.sectionTitleResolved}>Đã xử lý</Text>
            {resolved.map((event) => (
              <AlertCard
                key={event.id}
                event={event}
                acknowledging={acknowledgingId === event.id}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  scroll: { padding: 18 },
  noElderlyText: { color: '#0F172A', fontSize: 16.5, fontWeight: '700', textAlign: 'center' },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  errorText: { color: '#EF4444', fontSize: 14.5, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  emptySubtitle: { fontSize: 13.5, color: '#64748B', textAlign: 'center', marginTop: 4 },
  sectionTitleActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  sectionTitleResolved: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
});
