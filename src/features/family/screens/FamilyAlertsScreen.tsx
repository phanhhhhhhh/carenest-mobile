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
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useEmergencyEventStore } from '../store/emergencyEventStore';
import { AlertsHeader } from './familyAlerts/AlertsHeader';
import { AlertCard } from './familyAlerts/AlertCard';

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

  const [markingRead, setMarkingRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const elderlyId =
    dashboardData && dashboardData.linkedElderly.length > 0
      ? (dashboardData.linkedElderly[dashboardData.selectedIndex]?.elderlyId ?? null)
      : null;

  useEffect(() => {
    loadDashboard();
    // Load the dashboard once on mount; `loadDashboard` is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (elderlyId) load(elderlyId);
    // Re-run when the selected elderly changes; `load` is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId]);

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

  if (!elderlyId) {
    return (
      <SafeAreaView style={styles.container}>
        <AlertsHeader
          activeCount={0}
          marking={false}
          onMarkAllRead={() => {}}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.center}>
          <Image
            source={require('../../../../assets/mascot/mascot_wave_heart.jpg')}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
          <Text style={styles.noElderlyText}>Chưa liên kết người thân nào</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <ActivityIndicator color={Colors.primary} />
        </View>
      );
    }

    if (error && events.length === 0) {
      return (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => elderlyId && load(elderlyId)}>
            <Ionicons name="refresh" size={18} color={Colors.surface} />
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
            style={{ width: 130, height: 130 }}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>Không có cảnh báo</Text>
          <Text style={styles.emptySubtitle}>Mọi thứ đều ổn!</Text>
        </View>
      );
    }

    const active = events.filter((e) => e.status === 'ACTIVE');
    const resolved = events.filter((e) => e.status !== 'ACTIVE');

    return (
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {active.length > 0 && (
          <>
            <Text style={styles.sectionTitleActive}>Đang hoạt động</Text>
            {active.map((e) => (
              <View key={e.id} style={styles.cardWrapper}>
                <AlertCard
                  event={e}
                  acknowledging={acknowledgingId === e.id}
                  onAcknowledge={handleAcknowledge}
                />
              </View>
            ))}
          </>
        )}
        {resolved.length > 0 && (
          <>
            {active.length > 0 && <View style={{ height: 10 }} />}
            <Text style={styles.sectionTitleResolved}>Đã xử lý</Text>
            {resolved.map((e) => (
              <View key={e.id} style={styles.cardWrapper}>
                <AlertCard
                  event={e}
                  acknowledging={acknowledgingId === e.id}
                  onAcknowledge={handleAcknowledge}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },

  noElderlyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 16 },

  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 16 },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryText: { color: Colors.surface, fontSize: 14, fontWeight: '600' },

  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 6 },

  list: { padding: 16 },
  sectionTitleActive: { fontSize: 14, fontWeight: '600', color: Colors.error, marginBottom: 10 },
  sectionTitleResolved: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  cardWrapper: { marginBottom: 10 },
});
