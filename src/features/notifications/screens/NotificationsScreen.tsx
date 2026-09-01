import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { showSuccessToast } from '../../../shared/components/toastStore';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import {
  useNotificationStore,
  selectUnreadCount,
  type NotificationData,
} from '../store/notificationStore';
import { NotificationCard } from './notifications/NotificationCard';
import { routeForNotification, type Nav } from './notifications/utils';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const role = useAuthStore((s) => s.user?.role);

  const isLoading = useNotificationStore((s) => s.isLoading);
  const error = useNotificationStore((s) => s.error);
  const items = useNotificationStore((s) => s.items);
  const load = useNotificationStore((s) => s.load);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const respondToFamilyLinkRequest = useNotificationStore((s) => s.respondToFamilyLinkRequest);

  const [markingAll, setMarkingAll] = useState(false);

  useMountEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  });

  const unreadCount = selectUnreadCount(items);

  const handleFamilyLinkRequest = (notification: NotificationData) => {
    const linkId = Number(notification.data?.linkId);
    const familyName = String(notification.data?.familyName ?? 'Người thân');
    const relationship = notification.data?.relationship
      ? String(notification.data.relationship)
      : null;
    if (!linkId || Number.isNaN(linkId)) return;

    Alert.alert(
      'Yêu cầu kết nối gia đình',
      `${familyName}${relationship ? ` (${relationship})` : ''} muốn kết nối để theo dõi sức khỏe của bạn. Bạn có đồng ý không?`,
      [
        {
          text: 'Từ chối',
          style: 'cancel',
          onPress: async () => {
            const ok = await respondToFamilyLinkRequest(linkId, false);
            if (ok) load();
          },
        },
        {
          text: 'Chấp nhận',
          onPress: async () => {
            const ok = await respondToFamilyLinkRequest(linkId, true);
            if (ok) {
              showSuccessToast(`Đã kết nối với ${familyName}`);
              load();
            }
          },
        },
      ],
    );
  };

  const handleCardPress = (notification: NotificationData) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.type === 'FAMILY_LINK_REQUEST') {
      handleFamilyLinkRequest(notification);
      return;
    }
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
            <Text style={styles.retryButtonText}>Thử lại</Text>
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
        <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
        <Text style={styles.emptySubtitle}>Thông báo hệ thống sẽ xuất hiện tại đây</Text>
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
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => load()}
            tintColor={Colors.primary}
          />
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} mới</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markingAll}
            style={styles.markAllButton}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.markAllText}>Đánh dấu đã đọc tất cả</Text>
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
  backButton: { marginRight: 12 },
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
});
