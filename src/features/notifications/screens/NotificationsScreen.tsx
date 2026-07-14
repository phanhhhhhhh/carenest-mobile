import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import api from '../../../core/api/client';
import type { NotificationItem } from '../../../shared/types';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/users/me/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch { /* silent */ }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, !item.read && styles.cardUnread]} onPress={() => markAsRead(item.id)}>
            <View style={[styles.iconWrap, { backgroundColor: !item.read ? Colors.primary + '15' : Colors.background }]}>
              <Ionicons name="notifications-outline" size={20} color={!item.read ? Colors.primary : Colors.textHint} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifBody}>{item.body}</Text>
              <Text style={styles.notifTime}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, padding: 20 },
  list: { padding: 20, paddingTop: 0 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, flexDirection: 'row', gap: 12, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: Colors.primary },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, gap: 2 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  notifBody: { fontSize: 13, color: Colors.textSecondary },
  notifTime: { fontSize: 11, color: Colors.textHint, marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 4 },
  empty: { textAlign: 'center', color: Colors.textHint, marginTop: 40, fontSize: 14 },
});
