import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { NotificationData } from '../../store/notificationStore';
import { colorForType, formatTime, iconForType, withAlpha } from './utils';

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
            style={[styles.notifTitle, { fontWeight: notification.read ? '500' : '700' }]}
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
