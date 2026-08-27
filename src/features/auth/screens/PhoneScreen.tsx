import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { HintGray, White } from './register/theme';
import {
  normalizePhone,
  validateEmail,
  validateLoginPassword,
  validatePhone,
  type FieldErrors,
} from './phone/validators';
import { styles } from './phone/styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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
    } catch (err: unknown) {
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
              <Text style={[styles.label, phoneError && styles.labelError]}>Số điện thoại</Text>
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
                <Ionicons name="mail-outline" size={18} color={HintGray} style={styles.leftIcon} />
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
            <Text style={[styles.label, passwordError && styles.labelError]}>Mật khẩu</Text>
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
            <Text style={styles.loginBtnText}>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
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
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
              <Text style={styles.registerLink}>Đăng ký tài khoản ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
