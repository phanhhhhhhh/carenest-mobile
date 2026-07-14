import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PhoneScreen() {
  const navigation = useNavigation<Nav>();
  const { login, isLoading, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [phone, setPhone] = useState('');

  // Clear any stale store error on mount and when switching login method
  useEffect(() => {
    clearError();
  }, [clearError, usePhone]);

  const handleLogin = async () => {
    if (!password || (!usePhone && !email) || (usePhone && !phone)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const result = await login(
      usePhone ? { phone, password } : { email, password },
    );

    if (result.type === 'needsVerification') {
      // Email not verified yet — send user to the verify-email prompt (Flutter parity)
      navigation.navigate('VerifyEmailPrompt', { email: result.email });
      return;
    }
    if (result.type === 'error') {
      Alert.alert('Login Failed', result.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Toggle Email / Phone */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !usePhone && styles.toggleActive]}
              onPress={() => setUsePhone(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, !usePhone && styles.toggleTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, usePhone && styles.toggleActive]}
              onPress={() => setUsePhone(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, usePhone && styles.toggleTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {usePhone ? (
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+84..."
                keyboardType="phone-pad"
                placeholderTextColor={Colors.textHint}
              />
            </View>
          ) : (
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textHint}
              />
            </View>
          )}

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor={Colors.textHint}
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={{ fontWeight: '700', color: Colors.primary }}>
                Create Account
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  backBtn: { marginBottom: Spacing.xxl },
  backText: { fontSize: Typography.button.fontSize, color: Colors.textSecondary },
  title: { fontSize: Typography.h1.fontSize, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.buttonSmall.fontSize, color: Colors.textSecondary, marginTop: 6, marginBottom: 28 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.surface },
  toggleText: { fontSize: Typography.buttonSmall.fontSize, color: Colors.textSecondary, fontWeight: '500' },
  toggleTextActive: { color: Colors.primary, fontWeight: '700' },
  inputWrap: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  forgotText: { textAlign: 'right', color: Colors.primary, fontSize: Typography.bodySmall.fontSize, marginBottom: Spacing.xxl },
  loginBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: 'center' },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: 'white', fontSize: Typography.button.fontSize, fontWeight: '700' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { fontSize: Typography.buttonSmall.fontSize, color: Colors.textSecondary },
});
