import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyHomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('PinVerify')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Ionicons name="medkit" size={28} color={Colors.primary} />
            <Text style={styles.actionLabel}>Medication</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Ionicons name="heart" size={28} color={Colors.error} />
            <Text style={styles.actionLabel}>Health</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Ionicons name="calendar" size={28} color={Colors.warning} />
            <Text style={styles.actionLabel}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => {}}>
            <Ionicons name="chatbubble-ellipses" size={28} color={Colors.secondary} />
            <Text style={styles.actionLabel}>Chat AI</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Medications</Text>
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={40} color={Colors.textHint} />
            <Text style={styles.emptyText}>No medications scheduled for today</Text>
          </View>
        </View>

        {/* Recent Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Health</Text>
          <View style={styles.emptyCard}>
            <Ionicons name="fitness-outline" size={40} color={Colors.textHint} />
            <Text style={styles.emptyText}>No health data recorded yet</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: Colors.textSecondary },
  name: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, alignItems: 'center', width: '23%', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  actionLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 6, fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.textHint, marginTop: 8 },
});
