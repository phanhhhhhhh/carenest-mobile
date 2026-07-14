import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import {
  useNotificationStore,
  selectUnreadCount,
  type NotificationData,
} from '../store/notificationStore';

// ── Helpers (parity with _NotificationCard in notifications_screen.dart) ──
function formatTime(createdAt: string): string {
  const dt = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  // Day difference counted in whole calendar days, matching Dart's Duration.inDays
  // (floor of total elapsed days, not calendar-day boundary).
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffHours < 1) return `${diffMinutes}m ago`;
  const hh = dt.getHours();
  const mm = dt.getMinutes().toString().padStart(2, '0');
  if (diffDays === 0) return `Today ${hh}:${mm}`;
  if (diffDays === 1) return `Yesterday ${hh}:${mm}`;
  return `${diffDays} days ago`;
}

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'EMERGENCY':
      return 'alert-circle';
    case 'MEDICATION_REMINDER':
      return 'medkit';
    case 'HEALTH_ALERT':
      return 'warning';
    case 'FAMILY_LINK_REQUEST':
    case 'FAMILY_UPDATE':
      return 'people';
    default:
      return 'notifications';
  }
}

function colorForType(type: string): string {
  switch (type) {
    case 'EMERGENCY':
      return Colors.error;
    case 'MEDICATION_REMINDER':
      return Colors.warning;
    case 'HEALTH_ALERT':
      return Colors.error;
    case 'FAMILY_LINK_REQUEST':
    case 'FAMILY_UPDATE':
      return Colors.primary;
    default:
      return Colors.textSecondary;
  }
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

function NotificationCard({ notification }: { notification: NotificationData }) {
  const color = colorForType(notification.type);
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: notification.read ? Colors.surface : withAlpha(color, 0.04),
          borderWidth: notification.read ? 0 : 1,
          borderColor: notification.read ? 'transparent' : withAlpha(color, 0.3),
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.1) }]}>
        <Ionicons name={iconForType(notification.type)} color={color} size={22} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text
            style={[
              styles.notifTitle,
              { fontWeight: notification.read ? '500' : '700' },
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notifBody}>{notification.body}</Text>
        <Text style={styles.notifTime}>{formatTime(notification.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const items = useNotificationStore((s) => s.items);
  const load = useNotificationStore((s) => s.load);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = selectUnreadCount(items);

  let body: React.ReactNode;
  if (isLoading && items.length === 0) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  } else if (error != null && items.length === 0) {
    body = (
      <View style={styles.center}>
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Ionicons name="refresh" size={18} color={Colors.surface} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (items.length === 0) {
    body = (
      <View style={styles.center}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="notifications-outline" color={Colors.primary} size={40} />
        </View>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySubtitle}>System notifications will appear here</Text>
      </View>
    );
  } else {
    body = (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <NotificationCard notification={item} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => load()} tintColor={Colors.primary} />
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount} new</Text>
          </View>
        )}
      </View>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  badge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.error,
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  errorBox: { alignItems: 'center', padding: 32 },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: { color: Colors.surface, fontWeight: '600', fontSize: 14 },

  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: withAlpha(Colors.primary, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: 6,
    color: Colors.textSecondary,
    fontSize: 14,
  },

  list: { padding: 16 },
  card: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  notifTitle: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    marginLeft: 8,
  },
  notifBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  notifTime: { color: Colors.textHint, fontSize: 12, marginTop: 8 },
});
