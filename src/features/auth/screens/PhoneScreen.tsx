import React, { useState, useEffect, useRef } from 'react';
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
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

const Teal = '#12A79C';
const TealDark = '#0E8A81';
const LabelGray = '#6B7280';
const HintGray = '#B4BAC0';
const BorderGray = '#C9CED4';
const ErrorRed = '#E53935';
const White = '#FFFFFF';
const TextDark = '#37404A';

interface FieldErrors {
  phone?: string;
  email?: string;
  password?: string;
}

function validatePhone(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập số điện thoại';
  const digits = v.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length !== 9 || !/^[35789]/.test(digits)) {
    return 'Số điện thoại không đúng định dạng (VD: 0768554948)';
  }
  return undefined;
}

function normalizePhone(v: string): string {
  return '+84' + v.replace(/\D/g, '').replace(/^0+/, '');
}

function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
    return 'Email không đúng định dạng (VD: ten@gmail.com)';
  }
  return undefined;
}

function validateLoginPassword(v: string): string | undefined {
  if (!v) return 'Vui lòng nhập mật khẩu';
  if (v.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
  return undefined;
}

export default function PhoneScreen() {
  const navigation = useNavigation<Nav>();
  const { login, sendOtp, isLoading, clearError } = useAuthStore();

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]:
        field === 'phone'
          ? validatePhone(phone)
          : field === 'email'
            ? validateEmail(email)
            : validateLoginPassword(password),
    }));
  };

  const handleLogin = async () => {
    const allErrors: FieldErrors = {
      phone: method === 'phone' ? validatePhone(phone) : undefined,
      email: method === 'email' ? validateEmail(email) : undefined,
      password: validateLoginPassword(password),
    };
    (Object.keys(allErrors) as (keyof FieldErrors)[]).forEach((k) => {
      if (allErrors[k] === undefined) delete allErrors[k];
    });
    setErrors(allErrors);
    setTouched({ phone: true, email: true, password: true });
    if (Object.keys(allErrors).length > 0) {
      Alert.alert('Lỗi xác thực', 'Lỗi: ' + JSON.stringify(allErrors));
      return;
    }

    try {
    const result =
      method === 'phone'
        ? await login({ phone: normalizePhone(phone), password })
        : await login({ email: email.trim(), password });

    if (result.type === 'success') {
      navigation.navigate('WelcomeBack', {});
    } else if (result.type === 'needsVerification') {
      if (result.method === 'SMS') {
        // Tài khoản SĐT chưa xác thực -> gửi OTP rồi đưa sang màn xác thực
        await sendOtp(result.target, 'SMS');
        navigation.navigate('OtpVerify', {
          target: result.target,
          method: 'SMS',
          userName: '',
        });
      } else {
        navigation.navigate('VerifyEmailPrompt', { email: result.target });
      }
    } else {
      const raw = result.message || '';
      const friendly = /invalid (phone|email) or password/i.test(raw)
        ? 'Số điện thoại hoặc mật khẩu không đúng.'
        : raw || 'Thông tin đăng nhập không đúng. Vui lòng thử lại.';
      Alert.alert('Đăng nhập thất bại', friendly);
    }
    } catch (err: any) {
      console.warn('handleLogin unexpected error:', err);
      Alert.alert('Đăng nhập thất bại', 'Vui lòng thử lại.');
    }
  };

  const handleSocial = (provider: string) => {
    Alert.alert('Thông báo', `Đăng nhập bằng ${provider} đang được phát triển.`);
  };

  const phoneError = !!(touched.phone && errors.phone);
  const emailError = !!(touched.email && errors.email);
  const passwordError = !!(touched.password && errors.password);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={White} />
          </TouchableOpacity>

          <View style={styles.mascotWrapper}>
            <Image
              source={require('../../../../assets/mascot/mascot_phone.jpg')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>

          {/* Đăng nhập bằng số điện thoại hoặc email */}
          <View style={styles.roleRow}>
            {(
              [
                ['phone', 'Số điện thoại'],
                ['email', 'Email'],
              ] as const
            ).map(([value, text]) => (
              <TouchableOpacity
                key={value}
                style={[styles.roleBtn, method === value && styles.roleBtnActive]}
                onPress={() => setMethod(value)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={[styles.roleText, method === value && styles.roleTextActive]}>
                  {text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {method === 'phone' ? (
            <View style={styles.fieldBlock}>
              <Text style={[styles.label, phoneError && styles.labelError]}>
                Số điện thoại
              </Text>
              <View style={[styles.inputPill, phoneError && styles.inputPillError]}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={HintGray}
                  style={styles.leftIcon}
                />
                <Text style={styles.phonePrefix}>+84</Text>
                <View style={styles.prefixDivider} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(v) => {
                    const cleaned = v.replace(/\D/g, '');
                    setPhone(cleaned);
                    if (touched.phone) {
                      setErrors((prev) => ({ ...prev, phone: validatePhone(cleaned) }));
                    }
                  }}
                  onBlur={() => handleBlur('phone')}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={HintGray}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!isLoading}
                  maxLength={10}
                />
              </View>
              {phoneError && <Text style={styles.fieldError}>{errors.phone}</Text>}
            </View>
          ) : (
            <View style={styles.fieldBlock}>
              <Text style={[styles.label, emailError && styles.labelError]}>Email</Text>
              <View style={[styles.inputPill, emailError && styles.inputPillError]}>
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
                    if (touched.email) {
                      setErrors((prev) => ({ ...prev, email: validateEmail(v) }));
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="Nhập email"
                  placeholderTextColor={HintGray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!isLoading}
                />
              </View>
              {emailError && <Text style={styles.fieldError}>{errors.email}</Text>}
            </View>
          )}

          {/* Mật khẩu */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.label, passwordError && styles.labelError]}>
              Mật khẩu
            </Text>
            <View style={[styles.inputPill, passwordError && styles.inputPillError]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={HintGray}
                style={styles.leftIcon}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (touched.password) {
                    setErrors((prev) => ({
                      ...prev,
                      password: validateLoginPassword(v),
                    }));
                  }
                }}
                onBlur={() => handleBlur('password')}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={HintGray}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={HintGray}
                />
              </TouchableOpacity>
            </View>
            {passwordError && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={isLoading}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocial('Apple')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={28} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocial('Google')}
              activeOpacity={0.8}
            >
              <FontAwesome name="google" size={25} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => handleSocial('Facebook')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-facebook" size={28} color="#1877F2" />
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Chưa có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Đăng ký tài khoản ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: White,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 40,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mascotWrapper: {
    alignItems: 'center',
    marginBottom: 22,
  },
  mascot: {
    width: width * 0.55,
    height: width * 0.55,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: BorderGray,
    borderRadius: 9999,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: White,
  },
  roleBtnActive: {
    borderColor: Teal,
    backgroundColor: '#E8F7F5',
  },
  roleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: LabelGray,
  },
  roleTextActive: {
    color: Teal,
  },

  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '600',
    color: LabelGray,
    marginBottom: 7,
  },
  labelError: {
    color: ErrorRed,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: BorderGray,
    borderRadius: 9999,
    paddingHorizontal: 18,
    height: 54,
    backgroundColor: White,
  },
  inputPillError: {
    borderColor: ErrorRed,
  },
  leftIcon: {
    marginRight: 8,
  },
  phonePrefix: {
    fontSize: 15.5,
    fontWeight: '600',
    color: TextDark,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: BorderGray,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 15.5,
    color: TextDark,
    paddingVertical: 0,
  },
  fieldError: {
    fontSize: 13,
    color: ErrorRed,
    marginTop: 5,
    marginLeft: 16,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    fontSize: 14,
    color: TextDark,
  },

  loginBtn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: White,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E6E9',
  },
  dividerText: {
    fontSize: 13.5,
    color: LabelGray,
    marginHorizontal: 10,
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 22,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E3E6E9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: White,
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerHint: {
    fontSize: 14,
    color: TextDark,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: TextDark,
  },
});
