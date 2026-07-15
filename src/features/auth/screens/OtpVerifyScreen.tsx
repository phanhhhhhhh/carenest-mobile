import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OtpVerify'>;

const OTP_LENGTH = 6;

export default function OtpVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { target, method, userName } = route.params;
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  // ── Verify OTP ─────────────────────────────────────────────────
  const verifyOtpAction = useAuthStore((s) => s.verifyOtp);
  const sendOtpAction = useAuthStore((s) => s.sendOtp);
  const completeLogin = useAuthStore((s) => s.completeLogin);

  const verifyOtp = useCallback(async (otpCode: string) => {
    if (otpCode.length !== OTP_LENGTH) return;
    setLoading(true);
    // Store action persists tokens + user (Flutter persistAuth parity)
    const ok = await verifyOtpAction(target, otpCode);
    setLoading(false);
    if (ok) {
      setShowSuccess(true);
    } else {
      Alert.alert('Error', 'Invalid or expired verification code');
      setCode(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    }
  }, [target, userName, verifyOtpAction, completeLogin]);

  // ── Handle text change (single digit or paste) ────────────────
  const handleChange = useCallback((text: string, index: number) => {
    const sanitized = text.replace(/[^0-9]/g, '');

    // Paste — fill all fields from the pasted string
    if (sanitized.length > 1) {
      const digits = sanitized.slice(0, OTP_LENGTH).split('');
      const newCode = Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => { newCode[i] = d; });
      setCode(newCode);

      const nextEmpty = newCode.findIndex((d) => !d);
      if (nextEmpty !== -1) {
        inputs.current[nextEmpty]?.focus();
      } else {
        Keyboard.dismiss();
        verifyOtp(newCode.join(''));
      }
      return;
    }

    // Single character
    const newCode = [...code];
    newCode[index] = sanitized.slice(0, 1);
    setCode(newCode);

    if (sanitized && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when last digit is entered
    if (index === OTP_LENGTH - 1 && sanitized) {
      Keyboard.dismiss();
      verifyOtp(newCode.join(''));
    }
  }, [code, verifyOtp]);

  // ── Backspace — clear previous field when current is empty ────
  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key !== 'Backspace') return;
    if (code[index]) return; // Let onChangeText handle clearing
    if (index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  }, [code]);

  // ── Resend ────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    const ok = await sendOtpAction(target, method);
    if (ok) {
      Alert.alert('Code Sent', 'A new verification code has been sent.');
    } else {
      Alert.alert('Error', 'Could not resend code. Please try again.');
    }
  }, [target, method, sendOtpAction]);

  // ── Auto-navigate after success popup ──────────────────────────
  // useEffect handles timer cleanup tự động khi component unmount,
  // tránh memory leak / state-update-on-unmounted warning.
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => {
      setShowSuccess(false);
      completeLogin(); // AppNavigator tự chuyển sang Elderly/FamilyShell
    }, 1100);
    return () => clearTimeout(timer);
  }, [showSuccess, completeLogin]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          Enter the code sent to {target}
        </Text>

        <View style={styles.otpRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputs.current[i] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              editable={!loading}
              selectTextOnFocus
              autoComplete="one-time-code"
            />
          ))}
        </View>

        {loading && <Text style={styles.loading}>Verifying...</Text>}

        <TouchableOpacity
          onPress={handleResend}
          style={styles.resendBtn}
          disabled={loading}
        >
          <Text style={[styles.resendText, loading && styles.resendTextDisabled]}>
            Resend Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* Popup ngắn thay cho 1 màn hình riêng — tự đóng rồi vào thẳng app */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <Image
              source={require('../../../../assets/mascot/mascot_thumbsup_stethoscope.jpg')}
              style={styles.popupMascot}
              resizeMode="contain"
            />
            <Text style={styles.popupTitle}>Xác thực thành công!</Text>
            <Text style={styles.popupSubtitle}>
              Chào mừng bạn đến với CareNest{userName ? `, ${userName}` : ''}!
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
  },
  loading: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: 14,
    marginBottom: 12,
  },
  resendBtn: {
    alignSelf: 'center',
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    opacity: 0.5,
  },
  // ── Success popup ─────────────────────────────────────────────
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  popupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  popupMascot: {
    width: 130,
    height: 130,
    marginBottom: 8,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  popupSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
