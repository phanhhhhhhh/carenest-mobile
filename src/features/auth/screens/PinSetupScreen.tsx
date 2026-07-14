import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PIN_LENGTH = 4;

export default function PinSetupScreen() {
  const navigation = useNavigation<Nav>();

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [firstPin, setFirstPin] = useState('');
  const [loading, setLoading] = useState(false);
  const setupPin = useAuthStore((s) => s.setupPin);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Auto-focus the first box on mount and on step change
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, [step]);

  const handleChange = (text: string, index: number) => {
    // Allow only digits
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Advance to next box
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when the last digit is entered
    if (digit && index === PIN_LENGTH - 1) {
      const pinStr = [...newPin.slice(0, index), digit].join('');
      handleSubmit(pinStr);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      // Go back to previous box on backspace if current is empty
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const clearPin = () => {
    setPin(Array(PIN_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = async (pinStr?: string) => {
    const finalPin = pinStr ?? pin.join('');
    if (finalPin.length !== PIN_LENGTH) {
      Alert.alert('Error', 'Please enter a 4-digit PIN');
      return;
    }

    if (step === 'setup') {
      setFirstPin(finalPin);
      setPin(Array(PIN_LENGTH).fill(''));
      setStep('confirm');
    } else {
      if (finalPin !== firstPin) {
        Alert.alert('Error', 'PINs do not match. Please try again.', [
          { text: 'OK', onPress: () => { clearPin(); setStep('setup'); } },
        ]);
        return;
      }
      setLoading(true);
      const ok = await setupPin(finalPin, finalPin);
      if (ok) {
        // Shells are only registered when authenticated — flip the flag and
        // AppNavigator mounts the correct role shell automatically.
        useAuthStore.getState().completeLogin();
      } else {
        Alert.alert('Error', 'Could not set up PIN. Please try again.', [
          { text: 'OK', onPress: clearPin },
        ]);
      }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>{'← Back'}</Text>
          </TouchableOpacity>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, step === 'setup' && styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
          </View>

          {/* Heading */}
          <Text style={styles.title}>
            {step === 'setup' ? 'Set Up PIN' : 'Confirm PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'setup'
              ? 'Create a 4-digit PIN to secure your app'
              : 'Re-enter your PIN to confirm'}
          </Text>

          {/* PIN boxes */}
          <View style={styles.pinRow}>
            {pin.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                style={[styles.pinBox, digit ? styles.pinBoxFilled : null]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                autoComplete="off"
                textContentType="none"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={() => handleSubmit()}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {loading
                ? 'Setting up...'
                : step === 'setup'
                  ? 'Continue'
                  : 'Confirm PIN'}
            </Text>
          </TouchableOpacity>

          {/* Reset / start over when confirming */}
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
              <Text style={styles.resetText}>Start over</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },

  /* Step indicator */
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },

  /* Typography */
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 32,
    textAlign: 'center',
  },

  /* PIN boxes */
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 36,
  },
  pinBox: {
    width: 56,
    height: 66,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  pinBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F7FA',
  },

  /* Button */
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Reset link */
  resetBtn: {
    marginTop: 18,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
