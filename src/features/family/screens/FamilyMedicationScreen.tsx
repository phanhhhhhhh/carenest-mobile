import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import api from '../../../core/api/client';
import type { MedicationItem } from '../../../shared/types';

export default function FamilyMedicationScreen() {
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await api.get('/users/me/medications'); setMeds(Array.isArray(res.data) ? res.data : []); }
    catch { setMeds([]); }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Medication Tracking</Text>
      <FlatList
        data={meds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={[styles.dot, { backgroundColor: item.taken ? Colors.success : Colors.warning }]} />
              <View>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medDosage}>{item.dosage}</Text>
              </View>
            </View>
            <Text style={[styles.status, { color: item.taken ? Colors.success : Colors.warning }]}>{item.taken ? 'TAKEN' : 'PENDING'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No medications tracked</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, padding: 20 },
  list: { padding: 20, paddingTop: 0 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  medName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  medDosage: { fontSize: 13, color: Colors.textSecondary },
  status: { fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.textHint, marginTop: 40, fontSize: 14 },
});
