import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.countingContainer}>
          <Text style={styles.sosSendingText}>Đang chuẩn bị phát tín hiệu SOS...</Text>
          <View style={{ height: 16 }} />
          <View style={styles.sosRing}>
            <Text style={styles.sosCountdownNumber}>{count}</Text>
            <Text style={styles.sosCountdownUnit}>giây</Text>
          </View>
          <View style={{ height: 18 }} />
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.8}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
            <Text style={styles.cancelText}>Bấm vào đây để HỦY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.emergencyButton}>
          <View style={styles.emergencyIconBox}>
            <Ionicons name="alert-circle" size={28} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyButtonText}>GỌI CỨU TRỢ KHẨN CẤP (SOS)</Text>
            <Text style={styles.emergencySubtext}>Nhấn để báo ngay cho con cháu, người thân</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emergencyWrap: { width: '100%' },
  countingContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FECDD3',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  sosSendingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9F1239',
    textAlign: 'center',
  },
  sosRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  sosCountdownNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  sosCountdownUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginTop: -2,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    gap: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E11D48',
  },

  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#E11D48',
    shadowColor: '#BE123C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  emergencyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emergencySubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
});
