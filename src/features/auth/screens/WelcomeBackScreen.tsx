import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'WelcomeBack'>;

export default function WelcomeBackScreen() {
  const route = useRoute<Route>();
  const authStoreUser = useAuthStore((s) => s.user);
  const completeLogin = useAuthStore((s) => s.completeLogin);

  // Prefer route params, fall back to auth store
  const userName = route.params?.userName || authStoreUser?.name || 'User';

  const handleContinue = () => {
    // Flipping isAuthenticated makes AppNavigator mount the correct role
    // shell — the shells are not registered in the unauthenticated stack,
    // so a navigation.reset to them would throw.
    completeLogin();
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
    padding: Spacing.xxl,
  },
  mascotWrapper: {
    marginBottom: Spacing.xxxl,
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
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.buttonSmall.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
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
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
  },
});
