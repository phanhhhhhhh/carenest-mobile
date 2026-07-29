import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,

  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Teal palette matching the mockup
const Teal = '#12A79C';
const TealDark = '#0E8A81';
const LabelGray = '#6B7280';
const HintGray = '#B4BAC0';
const BorderGray = '#C9CED4';
const ErrorRed = '#E53935';
const White = '#FFFFFF';
const TextDark = '#37404A';

interface FieldErrors {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

// ── Validators (mirror backend rules) ─────────────────────────────

function validateName(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập họ và tên';
  if (v.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
  return undefined;
}

/**
 * Phone is entered as local digits, displayed next to a fixed +84 prefix.
 * Accepts "0768554948" or "768554948" -> normalized to +84768554948.
 */
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

/** Mirrors backend's @Email + 255-char-max rule on RegisterRequest.email. */
function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập email';
  if (v.trim().length > 255) return 'Email quá dài';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
    return 'Email không đúng định dạng (VD: ten@gmail.com)';
  }
  return undefined;
}

// Password rules (mirror backend regex) - drives both the live
// checklist and validation, so UI and API can never disagree.
const PASSWORD_RULES = [
  { key: 'length', label: 'Ít nhất 8 ký tự', test: (v: string) => v.length >= 8 },
  { key: 'upper', label: 'Ít nhất 1 chữ hoa', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Ít nhất 1 chữ thường', test: (v: string) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Ít nhất 1 chữ số', test: (v: string) => /\d/.test(v) },
  {
    key: 'special',
    label: 'Ít nhất 1 ký tự đặc biệt (VD: ! @ # ?)',
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

function isPasswordValid(v: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(v));
}

function validatePassword(v: string): string | undefined {
  if (!v) return 'Vui lòng nhập mật khẩu';
  if (!isPasswordValid(v)) {
    return 'Mật khẩu chưa đáp ứng đủ các điều kiện bên dưới';
  }
  return undefined;
}

/** Live checklist shown under the password field - elderly-friendly:
 *  always visible while typing, no tooltips, each rule ticks green. */
function PasswordChecklist({ value }: { value: string }) {
  return (
    <View style={styles.checklist}>
      <Text style={styles.checklistTitle}>Mật khẩu cần có:</Text>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <View key={rule.key} style={styles.checklistRow}>
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={ok ? Teal : HintGray}
            />
            <Text style={[styles.checklistLabel, ok && styles.checklistLabelOk]}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function validateConfirmPassword(pw: string, confirm: string): string | undefined {
  if (!confirm) return 'Vui lòng nhập lại mật khẩu';
  if (pw !== confirm) return 'Mật khẩu nhập lại không khớp';
  return undefined;
}

// ── Reusable field ────────────────────────────────────────────────

interface PillFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
}

function PillField({ label, error, touched, children }: PillFieldProps) {
  const showError = !!(touched && error);
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, showError && styles.labelError]}>{label}</Text>
      <View style={[styles.inputPill, showError && styles.inputPillError]}>
        {children}
      </View>
      {showError && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────

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
    } catch (err: any) {
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
              <Ionicons name="phone-portrait-outline" size={18} color={HintGray} style={styles.leftIcon} />
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
            <Ionicons name="lock-closed-outline" size={18} color={HintGray} style={styles.leftIcon} />
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
            <Ionicons name="lock-closed-outline" size={18} color={HintGray} style={styles.leftIcon} />
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
              Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{'\n'}
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
            <Text style={styles.registerBtnText}>
              {busy ? 'Đang xử lý...' : 'Đăng Ký'}
            </Text>
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
    marginBottom: 8,
  },
  mascot: {
    width: width * 0.48,
    height: width * 0.48,
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

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BorderGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Teal,
    borderColor: Teal,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: TextDark,
    lineHeight: 21,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  termsError: {
    marginLeft: 28,
    marginBottom: 4,
  },

  checklist: {
    backgroundColor: '#F2FAF9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: -4,
    marginBottom: 16,
  },
  checklistTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: LabelGray,
    marginBottom: 8,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checklistLabel: {
    fontSize: 13.5,
    color: LabelGray,
    marginLeft: 8,
  },
  checklistLabelOk: {
    color: Teal,
    fontWeight: '600',
  },

  registerBtn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: White,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginHint: {
    fontSize: 14,
    color: TextDark,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: TextDark,
  },
});
