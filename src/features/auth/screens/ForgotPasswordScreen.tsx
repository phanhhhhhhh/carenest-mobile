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
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { validateEmail } from './phone/validators';
import { ErrorRed, HintGray, Teal, TealDark, TextDark, White } from './register/theme';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  const handleSend = async () => {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      setTouched(true);
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={Teal} />
          </TouchableOpacity>

          {sent ? (
            /* Success State */
            <View style={styles.successWrapper}>
              <View style={styles.mascotWrapper}>
                <Image
                  source={require('../../../../assets/mascot/mascot_thumbsup.jpg')}
                  style={styles.mascot}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={22} color={Teal} />
                <Text style={styles.successBadgeText}>Đã gửi email thành công</Text>
              </View>

              <Text style={styles.title}>Kiểm tra hòm thư của bạn</Text>
              <Text style={styles.subtitle}>
                CareNest đã gửi liên kết đặt lại mật khẩu đến{'\n'}
                <Text style={styles.emailHighlight}>{email.trim()}</Text>
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Phone')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Quay lại đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>
                  {loading ? 'Đang gửi lại...' : 'Chưa nhận được email? Gửi lại'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Forgot Password Form */
            <View style={styles.formWrapper}>
              <View style={styles.mascotWrapper}>
                <Image
                  source={require('../../../../assets/mascot/mascot_confused.jpg')}
                  style={styles.mascot}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Quên mật khẩu?</Text>
              <Text style={styles.subtitle}>
                Đừng lo lắng! Hãy nhập địa chỉ email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn
                đặt lại mật khẩu.
              </Text>

              {/* Email Input */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.label, !!emailError && styles.labelError]}>Email</Text>
                <View style={[styles.inputPill, !!emailError && styles.inputPillError]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={HintGray}
                    style={styles.leftIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      if (touched) {
                        setEmailError(validateEmail(v));
                      }
                    }}
                    onBlur={() => {
                      setTouched(true);
                      setEmailError(validateEmail(email));
                    }}
                    placeholder="Nhập địa chỉ email của bạn"
                    placeholderTextColor={HintGray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSend}
                    editable={!loading}
                  />
                </View>
                {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
                </Text>
              </TouchableOpacity>

              {/* Return to Login */}
              <View style={styles.footerRow}>
                <Text style={styles.footerHint}>Nhớ lại mật khẩu? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Phone')}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: White },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  formWrapper: {
    flex: 1,
  },
  mascotWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  mascot: {
    width: width * 0.52,
    height: width * 0.52,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  emailHighlight: {
    fontWeight: '700',
    color: Teal,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  labelError: {
    color: ErrorRed,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#F8FAFC',
  },
  inputPillError: {
    borderColor: ErrorRed,
    backgroundColor: '#FFF5F5',
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TextDark,
    paddingVertical: 0,
  },
  fieldError: {
    fontSize: 12.5,
    color: ErrorRed,
    marginTop: 4,
    marginLeft: 12,
  },
  primaryBtn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: White,
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerHint: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Teal,
  },
  successWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  successBadgeText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Teal,
  },
  resendBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
