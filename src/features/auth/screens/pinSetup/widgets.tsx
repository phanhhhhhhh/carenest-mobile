import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Colors } from '../../../../core/theme/colors';

export function StepIndicator({ step }: { step: 'setup' | 'confirm' }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, step === 'setup' && styles.stepDotActive]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]} />
    </View>
  );
}

export function PinBoxes({
  pin,
  inputRefs,
  onChange,
  onKeyPress,
}: {
  pin: string[];
  inputRefs: React.MutableRefObject<(TextInput | null)[]>;
  onChange: (text: string, index: number) => void;
  onKeyPress: (key: string, index: number) => void;
}) {
  return (
    <View style={styles.pinRow}>
      {pin.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          style={[styles.pinBox, digit ? styles.pinBoxFilled : null]}
          value={digit}
          onChangeText={(t) => onChange(t, i)}
          onKeyPress={({ nativeEvent }) => onKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry
          autoComplete="off"
          textContentType="none"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
