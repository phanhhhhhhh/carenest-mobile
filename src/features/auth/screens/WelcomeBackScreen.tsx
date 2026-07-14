import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'WelcomeBack'>;

export default function WelcomeBackScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const authStoreUser = useAuthStore((s) => s.user);

  // Prefer route params, fall back to auth store
  const userName = route.params?.userName || authStoreUser?.name || 'User';
  const user = route.params?.user || authStoreUser;

  const handleContinue = () => {
    const role = user?.role || 'ELDERLY';
    navigation.reset({
      index: 0,
      routes: [{ name: role === 'ELDERLY' ? 'ElderlyShell' : 'FamilyShell' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Mascot image placeholder */}
        <View style={styles.mascotWrapper}>
          <View style={styles.mascotCircle}>
            <Text style={styles.mascotEmoji}>{'👶'}</Text>
          </View>
        </View>

        <Text style={styles.title}>Welcome back, {userName}!</Text>
        <Text style={styles.subtitle}>Your account has been verified successfully</Text>

        <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.btnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mascotWrapper: {
    marginBottom: 32,
    alignItems: 'center',
  },
  mascotCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mascotEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
