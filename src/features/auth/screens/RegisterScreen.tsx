import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;


interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  terms?: string;
}

function validateName(v: string): string | undefined {
  if (!v.trim()) return 'Full name is required';
  if (v.trim().length < 2) return 'Name must be at least 2 characters';
  return undefined;
}

function validateEmail(v: string): string | undefined {
  if (!v.trim()) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
  return undefined;
}

function validatePhone(v: string): string | undefined {
  if (!v.trim()) return undefined;
  const digits = v.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 11) return 'Enter a valid phone number';
  return undefined;
}

function validatePassword(v: string): string | undefined {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return undefined;
}

function validateConfirmPassword(pw: string, confirm: string): string | undefined {
  if (!confirm) return 'Please confirm your password';
  if (pw !== confirm) return 'Passwords do not match';
  return undefined;
}


export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ELDERLY' | 'FAMILY'>('ELDERLY');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const runValidation = (fields?: Record<string, string>): FieldErrors => {
    const e: FieldErrors = {};
    const n = fields?.name ?? name;
    const em = fields?.email ?? email;
    const ph = fields?.phone ?? phone;
    const pw = fields?.password ?? password;
    const cp = fields?.confirmPassword ?? confirmPassword;

    e.name = validateName(n);
    e.email = validateEmail(em);
    e.phone = validatePhone(ph);
    e.password = validatePassword(pw);
    e.confirmPassword = validateConfirmPassword(pw, cp);

    if (!agreedToTerms) e.terms = 'You must agree to the Terms of Service';

    Object.keys(e).forEach((k) => {
      if (e[k as keyof FieldErrors] === undefined) delete e[k as keyof FieldErrors];
    });
    return e;
  };

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => {
      const fresh = runValidation();
      return { ...prev, [field]: fresh[field] };
    });
  };

  const handleRegister = async () => {
    const allErrors = runValidation();
    setErrors(allErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (Object.keys(allErrors).length > 0) {
      const firstKey = Object.keys(allErrors)[0];
      Alert.alert('Validation Error', allErrors[firstKey as keyof FieldErrors]);
      return;
    }

    const normalizedPhone = phone.trim()
      ? '+84' + phone.replace(/\D/g, '').replace(/^0+/, '')
      : undefined;

    const result = await register({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: normalizedPhone,
      password,
      confirmPassword,
      role,
    });

    if (result.type === 'success') {
    } else if (result.type === 'needsVerification') {
      navigation.navigate('VerificationChoice', {
        email: email.trim() || '',
        phone: normalizedPhone || '',
        userName: name.trim(),
      });
    } else {
      Alert.alert('Registration Failed', result.message);
    }
  };

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
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>{'← Back'}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Fill in your details to complete registration
          </Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={[styles.input, touched.name && errors.name && styles.inputError]}
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (touched.name) setErrors((prev) => ({ ...prev, name: validateName(v) }));
            }}
            onBlur={() => handleBlur('name')}
            placeholder="Full Name"
            placeholderTextColor={Colors.textHint}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          {touched.name && errors.name && (
            <Text style={styles.fieldError}>{errors.name}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            ref={emailRef}
            style={[styles.input, touched.email && errors.email && styles.inputError]}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(v) }));
            }}
            onBlur={() => handleBlur('email')}
            placeholder="example@email.com"
            placeholderTextColor={Colors.textHint}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          {touched.email && errors.email && (
            <Text style={styles.fieldError}>{errors.email}</Text>
          )}

          <Text style={styles.label}>Phone</Text>
          <View style={styles.phoneWrap}>
            <View style={styles.prefixBadge}>
              <Text style={styles.prefixText}>+84</Text>
            </View>
            <TextInput
              ref={phoneRef}
              style={[
                styles.phoneInput,
                touched.phone && errors.phone && styles.inputError,
              ]}
              value={phone}
              onChangeText={(v) => {
                const cleaned = v.replace(/\D/g, '');
                setPhone(cleaned);
                if (touched.phone) setErrors((prev) => ({ ...prev, phone: validatePhone(cleaned) }));
              }}
              onBlur={() => handleBlur('phone')}
              placeholder="Phone number"
              placeholderTextColor={Colors.textHint}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isLoading}
            />
          </View>
          {touched.phone && errors.phone && (
            <Text style={styles.fieldError}>{errors.phone}</Text>
          )}

          <Text style={styles.label}>I am a *</Text>
          <View style={styles.roleRow}>
            {(['ELDERLY', 'FAMILY'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleActive]}
                onPress={() => setRole(r)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r === 'ELDERLY' ? '👴  Elderly' : '👨‍👩‍👧  Family'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Password *</Text>
          <TextInput
            ref={passwordRef}
            style={[styles.input, touched.password && errors.password && styles.inputError]}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (touched.password) {
                const pwErr = validatePassword(v);
                const cpErr = touched.confirmPassword
                  ? validateConfirmPassword(v, confirmPassword)
                  : undefined;
                setErrors((prev) => ({ ...prev, password: pwErr, confirmPassword: cpErr }));
              }
            }}
            onBlur={() => handleBlur('password')}
            placeholder="••••••••"
            placeholderTextColor={Colors.textHint}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          {touched.password && errors.password && (
            <Text style={styles.fieldError}>{errors.password}</Text>
          )}

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            ref={confirmRef}
            style={[
              styles.input,
              touched.confirmPassword && errors.confirmPassword && styles.inputError,
            ]}
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
            placeholder="••••••••"
            placeholderTextColor={Colors.textHint}
            secureTextEntry
            returnKeyType="done"
            editable={!isLoading}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
          )}

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => {
              const next = !agreedToTerms;
              setAgreedToTerms(next);
              if (touched.terms) {
                setErrors((prev) => ({
                  ...prev,
                  terms: next ? undefined : 'You must agree to the Terms of Service',
                }));
              }
            }}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && (
                <Text style={styles.checkMark}>{'✓'}</Text>
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
            </Text>
          </TouchableOpacity>
          {touched.terms && errors.terms && (
            <Text style={[styles.fieldError, { marginTop: -12, marginBottom: 12 }]}>
              {errors.terms}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.registerBtn, isLoading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerBtnText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.xxl,
    paddingBottom: 50,
  },

  backBtn: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: Typography.button.fontSize,
    color: Colors.textSecondary,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.buttonSmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.xxl,
  },

  label: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 14,
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
  inputError: {
    borderColor: Colors.error,
  },
  fieldError: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 2,
  },

  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixBadge: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginRight: 8,
  },
  prefixText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  roleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  roleText: {
    fontSize: Typography.buttonSmall.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  roleTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textHint,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkMark: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    flex: 1,
  },
  termsLink: {
    fontWeight: '700',
    color: Colors.primary,
  },

  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: Colors.surface,
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
  },
});
