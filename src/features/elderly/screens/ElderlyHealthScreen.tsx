import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import api from '../../../core/api/client';
import type { HealthMetric } from '../../../shared/types';

export default function ElderlyHealthScreen() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMetrics(); }, []);

  const loadMetrics = async () => {
    try { const res = await api.get('/elderly/me/health-metrics'); setMetrics(Array.isArray(res.data) ? res.data.slice(-10) : []); }
    catch { setMetrics([]); }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  const latestByType: Record<string, HealthMetric> = {};
  metrics.forEach((m) => { if (!latestByType[m.type] || new Date(m.recordedAt) > new Date(latestByType[m.type].recordedAt)) latestByType[m.type] = m; });

  const typeIcons: Record<string, string> = { BLOOD_PRESSURE: 'pulse-outline', HEART_RATE: 'heart-outline', BLOOD_GLUCOSE: 'water-outline', WEIGHT: 'barbell-outline', TEMPERATURE: 'thermometer-outline', SPO2: 'leaf-outline' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Health Metrics</Text>
        <View style={styles.grid}>
          {Object.entries(latestByType).map(([type, m]) => (
            <View key={type} style={styles.metricCard}>
              <Ionicons name={(typeIcons[type] || 'fitness-outline') as keyof typeof Ionicons.glyphMap} size={28} color={Colors.primary} />
              <Text style={styles.metricValue}>{m.value}{m.unit ? ` ${m.unit}` : ''}</Text>
              <Text style={styles.metricType}>{type.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, width: '47%', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  metricValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  metricType: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
});
