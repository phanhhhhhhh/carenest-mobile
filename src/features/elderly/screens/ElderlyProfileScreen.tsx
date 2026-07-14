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

export default function ElderlyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', action: () => {} },
    { icon: 'call-outline', label: 'Emergency Contacts', action: () => {} },
    { icon: 'document-text-outline', label: 'Health Report', action: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', action: () => {} },
    { icon: 'settings-outline', label: 'Settings', action: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>Elderly</Text>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={Colors.textSecondary} />
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
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  userRole: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  menu: { backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: Colors.surface, borderRadius: 14 },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
});
