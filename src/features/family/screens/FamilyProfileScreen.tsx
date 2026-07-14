import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';

export default function FamilyProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="people" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'Family'}</Text>
          <Text style={styles.role}>Family Member</Text>
        </View>

        <View style={styles.menu}>
          {[
            { icon: 'shield-checkmark-outline', label: 'Premium Plans', color: Colors.warning },
            { icon: 'document-text-outline', label: 'Weekly Summary', color: Colors.secondary },
            { icon: 'options-outline', label: 'Health Thresholds', color: Colors.primary },
            { icon: 'notifications-outline', label: 'Notification Settings', color: Colors.textSecondary },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  role: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  menu: { backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: Colors.surface, borderRadius: 14 },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
});
