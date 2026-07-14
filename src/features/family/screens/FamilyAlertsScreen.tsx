import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import api from '../../../core/api/client';
import type { EmergencyEvent } from '../../../shared/types';

export default function FamilyAlertsScreen() {
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await api.get('/elderly/me/emergency-events'); setEvents(Array.isArray(res.data) ? res.data : []); }
    catch { setEvents([]); }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Alerts</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, item.status === 'ACTIVE' && styles.cardActive]}>
            <Ionicons name={item.type === 'SOS' ? 'warning' : 'information-circle'} size={24} color={item.status === 'ACTIVE' ? Colors.error : Colors.textHint} />
            <View style={styles.cardContent}>
              <Text style={styles.eventType}>{item.type}</Text>
              <Text style={styles.eventDesc}>{item.description}</Text>
              <Text style={styles.eventTime}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'ACTIVE' ? Colors.error : Colors.success }]} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No alerts</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, padding: 20 },
  list: { padding: 20, paddingTop: 0 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardActive: { borderLeftWidth: 4, borderLeftColor: Colors.error },
  cardContent: { flex: 1, gap: 4 },
  eventType: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  eventDesc: { fontSize: 13, color: Colors.textSecondary },
  eventTime: { fontSize: 11, color: Colors.textHint, marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  empty: { textAlign: 'center', color: Colors.textHint, marginTop: 40, fontSize: 14 },
});
