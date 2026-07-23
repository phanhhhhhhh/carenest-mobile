import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../store/authStore';

export default function PinVerifyScreen() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const sanitized = text.replace(/[^0-9]/g, '');
    const newPin = [...pin];
    newPin[index] = sanitized;
    setPin(newPin);

    if (sanitized && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    const pinStr = newPin.join('');
    if (pinStr.length === 4) {
      verifyPin(pinStr);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      inputs.current[index - 1]?.focus();
    }
  };

  const verifyPinAction = useAuthStore((s) => s.verifyPin);

  const verifyPin = async (pinStr: string) => {
    setLoading(true);
    const result = await verifyPinAction(pinStr);
    if (result.valid) {
      useAuthStore.getState().completeLogin();
    } else {
      Alert.alert('Mã PIN không đúng', 'Mã PIN bạn nhập không chính xác. Vui lòng thử lại.');
      setPin(['', '', '', '']);
      inputs.current[0]?.focus();
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Nhập mã PIN để mở khóa</Text>
        <Text style={styles.subtitle}>Nhập mã PIN gồm 4 chữ số</Text>

        <View style={styles.pinRow}>
          {pin.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputs.current[i] = ref;
              }}
              style={[styles.pinBox, loading && styles.pinBoxDisabled]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              secureTextEntry
              editable={!loading}
              autoFocus={i === 0}
            />
          ))}
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Đang xác thực mã PIN...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 32,
    textAlign: 'center',
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  pinBox: {
    width: 60,
    height: 68,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  pinBoxDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
