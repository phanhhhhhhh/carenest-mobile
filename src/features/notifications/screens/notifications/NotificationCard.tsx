import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { NotificationData } from '../../store/notificationStore';
import { colorForType, formatTime, iconForType } from './utils';

export function NotificationCard({
  notification,
  onPress,
}: {
  notification: NotificationData;
  onPress: () => void;
}) {
  const color = colorForType(notification.type);
  return (
    <TouchableOpacity
      style={[styles.card, notification.read ? styles.cardRead : styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={iconForType(notification.type)} color={color} size={20} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text
            style={[styles.notifTitle, { fontWeight: notification.read ? '600' : '800' }]}
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

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    ...Shadows.sm,
  },
  cardRead: {
    borderColor: Colors.border,
    opacity: 0.85,
  },
  cardUnread: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  notifBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  notifTime: { color: Colors.textHint, fontSize: 11.5, marginTop: 6, fontWeight: '500' },
});
