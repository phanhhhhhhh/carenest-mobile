import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { Shadows } from '../../../core/theme/spacing';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { usePinEntry } from './pinSetup/usePinEntry';
import { StepIndicator, PinBoxes } from './pinSetup/widgets';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PIN_LENGTH = 4;

export default function PinSetupScreen() {
  const navigation = useNavigation<Nav>();

  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [firstPin, setFirstPin] = useState('');
  const [loading, setLoading] = useState(false);
  const setupPin = useAuthStore((s) => s.setupPin);

  const { pin, inputRefs, handleChange, handleKeyPress, clearPin, resetPin } = usePinEntry(
    PIN_LENGTH,
    (fullPin) => submitPin(fullPin),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [step, inputRefs]);

  async function submitPin(finalPin: string) {
    if (finalPin.length !== PIN_LENGTH) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã PIN gồm 4 chữ số');
      return;
    }

    if (step === 'setup') {
      setFirstPin(finalPin);
      resetPin();
      setStep('confirm');
      return;
    }

    if (finalPin !== firstPin) {
      Alert.alert('Lỗi', 'Mã PIN không khớp. Vui lòng thử lại.', [
        {
          text: 'OK',
          onPress: () => {
            clearPin();
            setStep('setup');
          },
        },
      ]);
      return;
    }

    setLoading(true);
    const ok = await setupPin(finalPin, finalPin);
    if (ok) {
      useAuthStore.getState().completeLogin();
    } else {
      Alert.alert('Lỗi', 'Không thể thiết lập mã PIN. Vui lòng thử lại.', [
        { text: 'OK', onPress: clearPin },
      ]);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            </View>

            <StepIndicator step={step} />

            <Text style={styles.title}>
              {step === 'setup' ? 'Thiết lập mã PIN' : 'Xác nhận mã PIN'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'setup'
                ? 'Tạo mã PIN gồm 4 chữ số để bảo vệ tài khoản và mở khóa nhanh'
                : 'Nhập lại mã PIN 4 chữ số để hoàn tất'}
            </Text>

            <PinBoxes
              pin={pin}
              inputRefs={inputRefs}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={() => submitPin(pin.join(''))}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {loading ? 'Đang thiết lập...' : step === 'setup' ? 'Tiếp tục' : 'Xác nhận mã PIN'}
              </Text>
            </TouchableOpacity>

            {step === 'confirm' && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setStep('setup');
                  setFirstPin('');
                  clearPin();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resetText}>Bắt đầu lại</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  btn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resetBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
