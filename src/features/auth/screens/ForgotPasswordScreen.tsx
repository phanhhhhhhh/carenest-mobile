import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim());
    if (result.success) {
      setSent(true);
    } else {
      Alert.alert('Lỗi', result.error || 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Quay lại</Text>
          </TouchableOpacity>

          {sent ? (
            <View style={styles.successWrap}>
              <Text style={styles.successIcon}>✉️</Text>
              <Text style={styles.successTitle}>Kiểm tra email của bạn</Text>
              <Text style={styles.successSub}>
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến {email.trim()}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Quên mật khẩu</Text>
              <Text style={styles.subtitle}>
                Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật
                khẩu.
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={Colors.textHint}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSend}
                disabled={loading}
              >
                <Text style={styles.btnText}>
                  {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { padding: Spacing.xxl, flexGrow: 1 },
  backBtn: { marginBottom: Spacing.xxl },
  backText: { fontSize: Typography.button.fontSize, color: Colors.textSecondary },
  title: {
    fontSize: Typography.h1.fontSize,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.buttonSmall.fontSize,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: 20,
  },
  inputWrap: { marginBottom: Spacing.xxl },
  label: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: Typography.button.fontSize, fontWeight: '700' },
  successWrap: { alignItems: 'center', marginTop: 60 },
  successIcon: { fontSize: 56, marginBottom: 20 },
  successTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  successSub: {
    fontSize: Typography.buttonSmall.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
