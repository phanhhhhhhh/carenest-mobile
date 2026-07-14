import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import api from '../../../core/api/client';
import type { ElderlySummary } from '../../../shared/types';

export default function FamilyDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [elderlyList, setElderlyList] = useState<ElderlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [medStats, setMedStats] = useState({ total: 0, taken: 0 });

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get(`/family/${user?.id}/elderly`);
      setElderlyList(Array.isArray(res.data) ? res.data : []);
    } catch { setElderlyList([]); }
    setLoading(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Welcome, {user?.name || 'Family'}</Text>
        <Text style={styles.subtitle}>Monitoring your loved ones</Text>

        {/* Elderly selector */}
        {elderlyList.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
            {elderlyList.map((e, i) => (
              <TouchableOpacity key={e.elderlyId} style={[styles.elderlyChip, i === selectedIndex && styles.elderlyChipActive]} onPress={() => setSelectedIndex(i)}>
                <Text style={[styles.elderlyChipText, i === selectedIndex && styles.elderlyChipTextActive]}>{e.elderlyName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="medkit" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{medStats.taken}/{medStats.total}</Text>
            <Text style={styles.statLabel}>Meds Taken</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="heart" size={24} color={Colors.error} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Health Status</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={Colors.warning} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { padding: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
  selector: { marginBottom: 20 },
  elderlyChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  elderlyChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  elderlyChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  elderlyChipTextActive: { color: 'white' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 6 },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
});
