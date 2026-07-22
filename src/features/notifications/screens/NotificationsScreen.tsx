import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import {
  useNotificationStore,
  selectUnreadCount,
  type NotificationData,
} from '../store/notificationStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Where tapping a notification of this type should land, per the current user's role. */
function routeForNotification(type: string, role: string | undefined, navigation: Nav): void {
  const isFamily = role === 'FAMILY';
  switch (type) {
    case 'EMERGENCY':
      if (isFamily) navigation.navigate('FamilyAlerts');
      break;
    case 'HEALTH_ALERT':
      if (isFamily) navigation.navigate('FamilyHealth');
      else navigation.navigate('ElderlyShell', { screen: 'ElderlyHealth' });
      break;
    case 'MEDICATION_REMINDER':
      if (isFamily) navigation.navigate('FamilyShell', { screen: 'FamilyMeds' });
      else navigation.navigate('ElderlyShell', { screen: 'ElderlyMeds' });
      break;
    case 'APPOINTMENT_REMINDER':
      if (isFamily) navigation.navigate('FamilyAppointments');
      else navigation.navigate('ElderlyAppointments');
      break;
    default:
      break;
  }
}

function formatTime(createdAt: string): string {
  const dt = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

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

function NotificationCard({
  notification,
  onPress,
}: {
  notification: NotificationData;
  onPress: () => void;
}) {
  const color = colorForType(notification.type);
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: notification.read ? Colors.surface : withAlpha(color, 0.04),
          borderWidth: notification.read ? 0 : 1,
          borderColor: notification.read ? 'transparent' : withAlpha(color, 0.3),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
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
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const role = useAuthStore((s) => s.user?.role);

  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const items = useNotificationStore((s) => s.items);
  const load = useNotificationStore((s) => s.load);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

  const unreadCount = selectUnreadCount(items);

  const handleCardPress = (notification: NotificationData) => {
    if (!notification.read) markAsRead(notification.id);
    routeForNotification(notification.type, role, navigation);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await markAllRead();
    setMarkingAll(false);
  };

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
        <Image
          source={require('../../../../assets/mascot/mascot_notifications.jpg')}
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
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
        renderItem={({ item }) => (
          <NotificationCard notification={item} onPress={() => handleCardPress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => load()} tintColor={Colors.primary} />
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll} style={styles.markAllButton}>
            {markingAll ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.markAllText}>Mark all read</Text>
            )}
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  badge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: Colors.error,
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  markAllButton: { paddingHorizontal: 8, paddingVertical: 4 },
  markAllText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

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
