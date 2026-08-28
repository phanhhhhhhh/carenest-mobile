import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import {
  OTP_LENGTH,
  RESEND_SECONDS,
  Teal,
  BorderGray,
  SubtitleGray,
  TextDark,
  White,
  displayPhone,
  formatCountdown,
} from './otpVerify/constants';
import { SuccessModal } from './otpVerify/SuccessModal';
import { useOtpInput } from './otpVerify/useOtpInput';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OtpVerify'>;

export default function OtpVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { target, method, userName } = route.params;
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const verifyOtpAction = useAuthStore((s) => s.verifyOtp);
  const sendOtpAction = useAuthStore((s) => s.sendOtp);

  const verifyOtp = useCallback(
    async (otpCode: string): Promise<boolean> => {
      if (otpCode.length !== OTP_LENGTH) return false;
      setLoading(true);
      const ok = await verifyOtpAction(target, otpCode);
      setLoading(false);
      if (ok) {
        setShowSuccess(true);
      } else {
        Alert.alert('Lỗi', 'Mã xác thực không đúng hoặc đã hết hạn');
      }
      return ok;
    },
    [target, verifyOtpAction],
  );

  const { code, inputs, handleChange, handleKeyPress, resetCode } = useOtpInput(verifyOtp);

  // Resend countdown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Popup "Xác thực thành công" hiển thị ngắn rồi tự chuyển màn tiếp theo
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => {
      setShowSuccess(false);
      navigation.replace('RegisterSuccess', { userName });
    }, 1400);
    return () => clearTimeout(timer);
  }, [showSuccess, navigation, userName]);

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    const ok = await sendOtpAction(target, method);
    if (ok) {
      setCountdown(RESEND_SECONDS);
      resetCode();
    } else {
      Alert.alert('Lỗi', 'Không thể gửi lại mã. Vui lòng thử lại.');
    }
  }, [countdown, target, method, sendOtpAction, resetCode]);

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
            <Text style={styles.resendCountdown}>Gửi lại mã sau {formatCountdown(countdown)}</Text>
          ) : (
            <Text style={styles.resendActive}>Gửi lại mã</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Popup xác thực thành công — tự chuyển màn sau 1.4s */}
      <SuccessModal visible={showSuccess} />
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
    paddingTop: 90,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Teal,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: SubtitleGray,
    marginBottom: 6,
  },
  phone: {
    fontSize: 16.5,
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
    width: 52,
    height: 66,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: BorderGray,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: TextDark,
    backgroundColor: White,
  },
  otpBoxFilled: {
    borderColor: Teal,
  },
  loading: {
    color: Teal,
    fontSize: 14.5,
    marginBottom: 12,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendCountdown: {
    fontSize: 14.5,
    color: SubtitleGray,
  },
  resendActive: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Teal,
  },
});
