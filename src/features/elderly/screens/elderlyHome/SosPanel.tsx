import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

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
          <Text style={styles.sosSendingText}>Đang chuẩn bị gửi tín hiệu SOS...</Text>
          <View style={{ height: 16 }} />
          <View style={styles.sosRing}>
            <Text style={styles.sosCountdownNumber}>{count}</Text>
            <Text style={styles.sosCountdownUnit}>giây</Text>
          </View>
          <View style={{ height: 18 }} />
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.8}>
            <Ionicons name="close-circle" size={22} color={Colors.textSecondary} />
            <Text style={styles.cancelText}>Hủy yêu cầu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.emergencyButton}>
            <View style={styles.emergencyIconBox}>
              <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyButtonText}>GỌI CỨU TRỢ KHẨN CẤP (SOS)</Text>
              <Text style={styles.emergencySubtext}>Nhấn để báo ngay cho người thân và bác sĩ</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emergencyWrap: { width: '100%' },
  countingContainer: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.sosLight,
    shadowColor: Colors.sosPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.sosPrimary,
    shadowColor: Colors.sosPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  emergencyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emergencySubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  sosSendingText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.sosPrimary,
  },
  sosRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: Colors.sosPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sosLight,
  },
  sosCountdownNumber: { fontSize: 52, fontWeight: '900', color: Colors.sosPrimary, lineHeight: 56 },
  sosCountdownUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.sosDark,
    textTransform: 'uppercase',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  cancelText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
});
