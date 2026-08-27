import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../../../../core/theme';

/**
 * 3-second SOS countdown. `start()` begins it; when the count reaches zero
 * `onFire` runs. `cancel()` aborts. The interval is always cleared on unmount.
 */
export function useSosCountdown(onFire: () => void) {
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(3);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = () => {
    setActive(true);
    setCount(3);
    let remaining = 3;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setActive(false);
        setCount(0);
        onFire();
      } else {
        setCount(remaining);
      }
    }, 1000);
  };

  const cancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
  };

  return { active, count, start, cancel };
}

export function SosPanel({
  countingDown,
  count,
  onPress,
  onCancel,
}: {
  countingDown: boolean;
  count: number;
  onPress: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.emergencyWrap}>
      {countingDown ? (
        <>
          <Text style={styles.sosSendingText}>Đang gửi tín hiệu khẩn cấp...</Text>
          <View style={{ height: 16 }} />
          <View style={styles.sosRing}>
            <Text style={styles.sosCountdownNumber}>{count}</Text>
          </View>
          <View style={{ height: 16 }} />
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.emergencyButton}>
            <View style={styles.emergencyIconBox}>
              <Ionicons name="alert" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.emergencyButtonText}>GỌI KHẨN CẤP</Text>
          </TouchableOpacity>
          <View style={{ height: 10 }} />
          <Text style={styles.sosHint}>Nhấn để gửi tín hiệu khẩn cấp trong 3 giây</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emergencyWrap: { alignItems: 'center' },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.textPrimary,
  },
  emergencyIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sosSendingText: {
    fontSize: Typography.button.fontSize,
    fontWeight: '600',
    color: Colors.sosPrimary,
  },
  sosRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: Colors.sosLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  sosCountdownNumber: { fontSize: 48, fontWeight: '700', color: Colors.sosPrimary },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  cancelText: { fontSize: Typography.button.fontSize, color: Colors.textSecondary },
  sosHint: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall.fontSize,
    textAlign: 'center',
  },
});
