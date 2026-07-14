import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';

export default function FamilyHealthScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Health Monitoring</Text>
        <View style={styles.emptyCard}>
          <Ionicons name="fitness-outline" size={50} color={Colors.textHint} />
          <Text style={styles.emptyText}>Select an elderly profile to view health data</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.textHint, marginTop: 12, textAlign: 'center' },
});
