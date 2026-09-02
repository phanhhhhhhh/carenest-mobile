import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors } from '../../../core/theme/colors';
import { HintGray, White, type FieldErrors } from './register/theme';
import {
  normalizePhone,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from './register/validators';
import { PasswordChecklist, PillField } from './register/components';
import { styles } from './register/styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register, sendOtp, isLoading } = useAuthStore();

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<'ELDERLY' | 'FAMILY'>('ELDERLY');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPwRules, setShowPwRules] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const runValidation = useCallback((): FieldErrors => {
    const e: FieldErrors = {
      name: validateName(name),
      phone: method === 'phone' ? validatePhone(phone) : undefined,
      email: method === 'email' ? validateEmail(email) : undefined,
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
      terms: agreedToTerms
        ? undefined
        : 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật',
    };
    (Object.keys(e) as (keyof FieldErrors)[]).forEach((k) => {
      if (e[k] === undefined) delete e[k];
    });
    return e;
  }, [name, phone, email, method, password, confirmPassword, agreedToTerms]);

  // Validate on blur (user leaves the field)
  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: runValidation()[field] }));
  };

  const handleRegister = async () => {
    const allErrors = runValidation();
    setErrors(allErrors);
    setTouched({
      name: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });
    if (Object.keys(allErrors).length > 0) {
      Alert.alert('Lỗi xác thực', 'Lỗi: ' + JSON.stringify(allErrors));
      return;
    }

    const otpMethod: 'SMS' | 'EMAIL' = method === 'phone' ? 'SMS' : 'EMAIL';
    const target = method === 'phone' ? normalizePhone(phone) : email.trim();
    setSubmitting(true);

    try {
      const result = await register({
        name: name.trim(),
        ...(method === 'phone' ? { phone: target } : { email: target }),
        password,
        confirmPassword,
        role,
      });

      if (result.type === 'needsVerification') {
        await sendOtp(target, otpMethod);
        setSubmitting(false);
        navigation.navigate('OtpVerify', {
          target,
          method: otpMethod,
          userName: name.trim(),
        });
      } else if (result.type === 'success') {
        // Đăng ký xong không cần xác thực (trường hợp backend cũ) -> đi đăng nhập
        setSubmitting(false);
        Alert.alert('Đăng ký thành công', 'Vui lòng đăng nhập để tiếp tục.', [
          { text: 'Đăng nhập', onPress: () => navigation.navigate('Phone') },
        ]);
      } else {
        setSubmitting(false);
        const raw = result.message || '';
        const friendly = /already registered/i.test(raw)
          ? method === 'phone'
            ? 'Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.'
            : 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.'
          : raw || 'Đăng ký thất bại. Vui lòng thử lại.';
        Alert.alert('Đăng ký thất bại', friendly);
      }
    } catch (err: unknown) {
      setSubmitting(false);
      console.warn('handleRegister unexpected error:', err);
      Alert.alert('Đăng ký thất bại', 'Vui lòng thử lại.');
    }
  };

  const busy = isLoading || submitting;

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
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.mascotWrapper}>
            <Image
              source={require('../../../../assets/mascot/mascot_phone.jpg')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>

          {/* Họ và tên — backend yêu cầu, style đồng bộ mockup */}
          <PillField label="Họ và tên" error={errors.name} touched={touched.name}>
            <Ionicons name="person-outline" size={18} color={HintGray} style={styles.leftIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (touched.name) {
                  setErrors((prev) => ({ ...prev, name: validateName(v) }));
                }
              }}
              onBlur={() => handleBlur('name')}
              placeholder="Nhập họ và tên"
              placeholderTextColor={HintGray}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
              editable={!busy}
            />
          </PillField>

          {/* Đăng ký bằng số điện thoại hoặc email */}
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
                disabled={busy}
              >
                <Text style={[styles.roleText, method === value && styles.roleTextActive]}>
                  {text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {method === 'phone' ? (
            <PillField label="Số điện thoại" error={errors.phone} touched={touched.phone}>
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={HintGray}
                style={styles.leftIcon}
              />
              <Text style={styles.phonePrefix}>+84</Text>
              <View style={styles.prefixDivider} />
              <TextInput
                ref={phoneRef}
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
                editable={!busy}
                maxLength={10}
              />
            </PillField>
          ) : (
            <PillField label="Email" error={errors.email} touched={touched.email}>
              <Ionicons name="mail-outline" size={18} color={HintGray} style={styles.leftIcon} />
              <TextInput
                ref={emailRef}
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
                editable={!busy}
              />
            </PillField>
          )}

          <PillField label="Mật khẩu" error={errors.password} touched={touched.password}>
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
                    password: validatePassword(v),
                    confirmPassword: touched.confirmPassword
                      ? validateConfirmPassword(v, confirmPassword)
                      : prev.confirmPassword,
                  }));
                }
              }}
              onFocus={() => setShowPwRules(true)}
              onBlur={() => handleBlur('password')}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={HintGray}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              blurOnSubmit={false}
              editable={!busy}
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
          </PillField>

          {showPwRules && <PasswordChecklist value={password} />}

          <PillField
            label="Nhập lại mật khẩu"
            error={errors.confirmPassword}
            touched={touched.confirmPassword}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={HintGray}
              style={styles.leftIcon}
            />
            <TextInput
              ref={confirmRef}
              style={styles.input}
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (touched.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateConfirmPassword(password, v),
                  }));
                }
              }}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={HintGray}
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              editable={!busy}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((s) => !s)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={HintGray}
              />
            </TouchableOpacity>
          </PillField>

          {/* Vai trò — backend yêu cầu */}
          <Text style={styles.label}>Bạn là</Text>
          <View style={styles.roleRow}>
            {(
              [
                ['ELDERLY', 'Người cao tuổi'],
                ['FAMILY', 'Người thân'],
              ] as const
            ).map(([value, text]) => (
              <TouchableOpacity
                key={value}
                style={[styles.roleBtn, role === value && styles.roleBtnActive]}
                onPress={() => setRole(value)}
                activeOpacity={0.8}
                disabled={busy}
              >
                <Text style={[styles.roleText, role === value && styles.roleTextActive]}>
                  {text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
              const next = !agreedToTerms;
              setAgreedToTerms(next);
              setTouched((prev) => ({ ...prev, terms: true }));
              setErrors((prev) => ({
                ...prev,
                terms: next
                  ? undefined
                  : 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật',
              }));
            }}
            activeOpacity={0.7}
            disabled={busy}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Ionicons name="checkmark" size={14} color={White} />}
            </View>
            <Text style={styles.termsText}>
              Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            </Text>
          </TouchableOpacity>
          {touched.terms && errors.terms && (
            <Text style={[styles.fieldError, styles.termsError]}>{errors.terms}</Text>
          )}

          <TouchableOpacity
            style={[styles.registerBtn, busy && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>{busy ? 'Đang xử lý...' : 'Đăng Ký'}</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Phone')} disabled={busy}>
              <Text style={styles.loginLink}>Đăng nhập tài khoản ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
