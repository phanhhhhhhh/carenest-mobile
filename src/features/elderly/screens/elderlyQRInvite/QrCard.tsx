import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { InviteTokenData } from '../../../../core/api/inviteApi';
import { QR_SIZE, formatCountdown } from './countdown';

export function QrCard({
  loading,
  error,
  invite,
  isExpired,
  secondsLeft,
  onRefresh,
}: {
  loading: boolean;
  error: string | null;
  invite: InviteTokenData | null;
  isExpired: boolean;
  secondsLeft: number;
  onRefresh: () => void;
}) {
  const countdownColor = secondsLeft > 120 ? '#059669' : secondsLeft > 30 ? '#D97706' : '#EF4444';
  const countdownBg = secondsLeft > 120 ? '#ECFDF5' : secondsLeft > 30 ? '#FEF3C7' : '#FEE2E2';

  return (
    <View style={styles.qrCard}>
      {loading ? (
        <View style={styles.qrPlaceholder}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tạo mã QR kết nối...</Text>
        </View>
      ) : error ? (
        <View style={styles.qrPlaceholder}>
          <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : invite ? (
        <>
          <View style={[styles.qrWrapper, isExpired && styles.qrExpired]}>
            <QRCode
              value={invite.token}
              size={QR_SIZE}
              color={isExpired ? '#94A3B8' : '#0F172A'}
              backgroundColor="#FFFFFF"
              logo={undefined}
            />
            {isExpired && (
              <View style={styles.expiredOverlay}>
                <Ionicons name="time-outline" size={44} color="#FFFFFF" />
                <Text style={styles.expiredOverlayText}>Mã đã hết hạn</Text>
              </View>
            )}
          </View>

          {!isExpired ? (
            <View style={[styles.countdownRow, { backgroundColor: countdownBg }]}>
              <Ionicons name="timer-outline" size={20} color={countdownColor} />
              <Text style={[styles.countdownText, { color: countdownColor }]}>
                Hết hạn sau: {formatCountdown(secondsLeft)}
              </Text>
            </View>
          ) : (
            <Text style={styles.expiredText}>Mã kết nối đã hết hạn, hãy tạo mã mới</Text>
          )}
        </>
      ) : null}

      {(isExpired || error) && !loading && (
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.85}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.refreshText}>Tạo mã QR mới</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.md,
    gap: 16,
  },
  qrPlaceholder: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: { color: '#64748B', fontSize: 14.5, fontWeight: '600' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  qrWrapper: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  qrExpired: { opacity: 0.4 },
  expiredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  expiredOverlayText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    gap: 8,
  },
  countdownText: { fontSize: 14.5, fontWeight: '800' },
  expiredText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 9999,
    gap: 8,
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  refreshText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
