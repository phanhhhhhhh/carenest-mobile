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
import type { EmergencyEvent } from '../../../shared/types';

function eventTitle(type: string): string {
  switch (type) {
    case 'SOS':
    case 'EMERGENCY':
      return 'Khẩn cấp SOS';
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      return 'Bỏ lỡ uống thuốc';
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      return 'Chỉ số sức khỏe bất thường';
    default:
      return 'Cảnh báo';
  }
}

function eventIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'SOS':
    case 'EMERGENCY':
      return 'alert-circle';
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      return 'medkit';
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      return 'warning';
    default:
      return 'notifications';
  }
}

function eventColor(type: string): string {
  switch (type) {
    case 'SOS':
    case 'EMERGENCY':
      return Colors.sosPrimary;
    case 'MISSED_MEDICATION':
    case 'MEDICATION_REMINDER':
      return Colors.warning;
    case 'ABNORMAL_VITALS':
    case 'HEALTH_ALERT':
      return Colors.error;
    default:
      return Colors.primary;
  }
}

function formatRelative(createdAt: string): string {
  const dt = new Date(createdAt);
  const diffMs = Date.now() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor(
    (startOfDay(new Date()).getTime() - startOfDay(dt).getTime()) / (24 * 60 * 60 * 1000),
  );

  const hh = dt.getHours();
  const mm = String(dt.getMinutes()).padStart(2, '0');

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffHours < 1) return `${diffMinutes} phút trước`;
  if (diffDays === 0) return `Hôm nay ${hh}:${mm}`;
  if (diffDays === 1) return `Hôm qua ${hh}:${mm}`;
  return `${diffDays} ngày trước`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
        {renderHeader(0, false, () => {})}
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
      {renderHeader(activeCount, markingRead, handleMarkAllRead)}
      {renderBody()}
    </SafeAreaView>
  );

  function renderHeader(count: number, marking: boolean, onMarkAllRead: () => void) {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Cảnh báo</Text>
          {count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count} mới</Text>
            </View>
          )}
        </View>
        {count > 0 && (
          <TouchableOpacity onPress={onMarkAllRead} disabled={marking} style={styles.markAllButton}>
            {marking ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.markAllText}>Đánh dấu đã đọc tất cả</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

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
                {renderEventCard(e)}
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
                {renderEventCard(e)}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  }

  function renderEventCard(event: EmergencyEvent) {
    const isActive = event.status === 'ACTIVE';
    const color = eventColor(event.type);
    const icon = eventIcon(event.type);
    const title = eventTitle(event.type);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: isActive ? hexToRgba(color, 0.04) : Colors.surface },
          isActive && { borderWidth: 1, borderColor: hexToRgba(color, 0.3) },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: hexToRgba(color, 0.1) }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text
              style={[
                styles.cardTitle,
                { color: isActive ? Colors.textPrimary : Colors.textSecondary },
              ]}
            >
              {title}
            </Text>
            {isActive ? (
              <View style={styles.activeDot} />
            ) : (
              <Ionicons name="checkmark-circle" color={Colors.success} size={18} />
            )}
          </View>
          <Text style={styles.cardDesc}>{event.description}</Text>
          <View style={styles.cardFooterRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textHint} />
            <Text style={styles.cardTime}>{formatRelative(event.createdAt)}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isActive
                    ? hexToRgba(Colors.error, 0.08)
                    : hexToRgba(Colors.success, 0.08),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isActive ? Colors.error : Colors.success },
                ]}
              >
                {isActive ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ XỬ LÝ'}
              </Text>
            </View>
            {isActive && (
              <TouchableOpacity
                style={styles.ackButton}
                disabled={acknowledgingId === event.id}
                onPress={() => handleAcknowledge(event.id)}
              >
                {acknowledgingId === event.id ? (
                  <ActivityIndicator size="small" color={Colors.success} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
                    <Text style={styles.ackText}>Xác nhận đã biết</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { marginRight: 12 },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  markAllButton: { paddingHorizontal: 8, paddingVertical: 4, minWidth: 16, alignItems: 'center' },
  markAllText: { color: Colors.primary, fontSize: 13, fontWeight: '500' },

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

  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: hexToRgba(Colors.success, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
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
  card: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '600', fontSize: 15, flexShrink: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  cardDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  cardTime: { color: Colors.textHint, fontSize: 12, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 8,
  },
  ackText: { color: Colors.success, fontSize: 12, fontWeight: '500' },
});
