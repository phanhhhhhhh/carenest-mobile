import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import api from '../../../core/api/client';
import type { MedicationItem } from '../../../shared/types';

export default function ElderlyMedicationScreen() {
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMeds(); }, []);

  const loadMeds = async () => {
    try {
      const res = await api.get('/users/me/medications');
      setMedications(Array.isArray(res.data) ? res.data : []);
    } catch { setMedications([]); }
    finally { setLoading(false); }
  };

  const toggleTaken = async (med: MedicationItem) => {
    try {
      await api.post(`/medications/${med.id}/logs`, {
        medicationId: parseInt(med.id),
        status: med.taken ? 'MISSED' : 'TAKEN',
        takenAt: new Date().toISOString(),
      });
      loadMeds();
    } catch { /* revert */ }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Medications</Text>
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, item.taken && styles.cardTaken]} onPress={() => toggleTaken(item)}>
            <View style={styles.cardLeft}>
              <Ionicons name={item.taken ? 'checkmark-circle' : 'medkit-outline'} size={24} color={item.taken ? Colors.success : Colors.primary} />
              <View style={styles.cardInfo}>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medDosage}>{item.dosage}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No medications</Text>}
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
  cardTaken: { opacity: 0.6 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { gap: 2 },
  medName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  medDosage: { fontSize: 13, color: Colors.textSecondary },
  empty: { textAlign: 'center', color: Colors.textHint, marginTop: 40, fontSize: 14 },
});
