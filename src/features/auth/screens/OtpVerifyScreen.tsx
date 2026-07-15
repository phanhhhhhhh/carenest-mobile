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
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OtpVerify'>;

const OTP_LENGTH = 6; // backend generates 6-digit codes
const RESEND_SECONDS = 45;

const Teal = '#12A79C';
const SuccessGreen = '#22C55E';
const SubtitleGray = '#8E8E8E';
const BorderGray = '#C9CED4';
const TextDark = '#37404A';
const White = '#FFFFFF';

/** +84768554948 -> 0768554948 for display */
function displayPhone(target: string): string {
  if (target.startsWith('+84')) return '0' + target.slice(3);
  return target;
}

function formatCountdown(s: number): string {
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function OtpVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { target, method, userName } = route.params;
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputs = useRef<(TextInput | null)[]>([]);

  const verifyOtpAction = useAuthStore((s) => s.verifyOtp);
  const sendOtpAction = useAuthStore((s) => s.sendOtp);

  // Resend countdown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const verifyOtp = useCallback(
    async (otpCode: string) => {
      if (otpCode.length !== OTP_LENGTH) return;
      setLoading(true);
      const ok = await verifyOtpAction(target, otpCode);
      setLoading(false);
      if (ok) {
        setShowSuccess(true);
      } else {
        Alert.alert('Lỗi', 'Mã xác thực không đúng hoặc đã hết hạn');
        setCode(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
      }
    },
    [target, verifyOtpAction]
  );

  // Popup "Xác thực thành công" hiển thị ngắn rồi tự chuyển màn tiếp theo
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => {
      setShowSuccess(false);
      navigation.replace('WelcomeBack', { userName });
    }, 1400);
    return () => clearTimeout(timer);
  }, [showSuccess, navigation, userName]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      const sanitized = text.replace(/[^0-9]/g, '');

      if (sanitized.length > 1) {
        const digits = sanitized.slice(0, OTP_LENGTH).split('');
        const newCode = Array(OTP_LENGTH).fill('');
        digits.forEach((d, i) => {
          newCode[i] = d;
        });
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

      const newCode = [...code];
      newCode[index] = sanitized.slice(0, 1);
      setCode(newCode);

      if (sanitized && index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }

      if (index === OTP_LENGTH - 1 && sanitized) {
        Keyboard.dismiss();
        verifyOtp(newCode.join(''));
      }
    },
    [code, verifyOtp]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key !== 'Backspace') return;
      if (code[index]) return;
      if (index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    const ok = await sendOtpAction(target, method);
    if (ok) {
      setCountdown(RESEND_SECONDS);
      setCode(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } else {
      Alert.alert('Lỗi', 'Không thể gửi lại mã. Vui lòng thử lại.');
    }
  }, [countdown, target, method, sendOtpAction]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Ionicons name="arrow-back" size={20} color={White} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Xác thực số điện thoại</Text>
        <Text style={styles.subtitle}>Nhập mã OTP đã gửi đến</Text>
        <Text style={styles.phone}>{displayPhone(target)}</Text>

        <View style={styles.otpRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputs.current[i] = ref;
              }}
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

        {loading && <Text style={styles.loading}>Đang xác thực...</Text>}

        <TouchableOpacity
          onPress={handleResend}
          style={styles.resendBtn}
          disabled={loading || countdown > 0}
        >
          {countdown > 0 ? (
            <Text style={styles.resendCountdown}>
              Gửi lại mã sau {formatCountdown(countdown)}
            </Text>
          ) : (
            <Text style={styles.resendActive}>Gửi lại mã</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Popup xác thực thành công — tự chuyển màn sau 1.4s */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={34} color={White} />
            </View>
            <Text style={styles.popupTitle}>Xác thực thành công!</Text>
            <Text style={styles.popupSubtitle}>
              Bạn đã xác thực số điện thoại{'\n'}thành công.
            </Text>
            <Image
              source={require('../../../../assets/brand/logo_wordmark.jpg')}
              style={styles.popupLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: White,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 24,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Teal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: SubtitleGray,
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    fontWeight: '600',
    color: TextDark,
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    width: 44,
    height: 58,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: BorderGray,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: TextDark,
    backgroundColor: White,
  },
  otpBoxFilled: {
    borderColor: Teal,
  },
  loading: {
    color: Teal,
    fontSize: 13,
    marginBottom: 12,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendCountdown: {
    fontSize: 13,
    color: SubtitleGray,
  },
  resendActive: {
    fontSize: 13,
    fontWeight: '700',
    color: Teal,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  popupCard: {
    backgroundColor: White,
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SuccessGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Teal,
    marginBottom: 8,
  },
  popupSubtitle: {
    fontSize: 13,
    color: SubtitleGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  popupLogo: {
    width: 130,
    height: 38,
  },
});
