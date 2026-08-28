import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../../core/theme/colors';
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
  const countdownColor =
    secondsLeft > 120 ? Colors.secondary : secondsLeft > 30 ? Colors.warning : Colors.error;

  return (
    <View style={styles.qrCard}>
      {loading ? (
        <View style={styles.qrPlaceholder}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tạo mã QR...</Text>
        </View>
      ) : error ? (
        <View style={styles.qrPlaceholder}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : invite ? (
        <>
          <View style={[styles.qrWrapper, isExpired && styles.qrExpired]}>
            <QRCode
              value={invite.token}
              size={QR_SIZE}
              color={isExpired ? '#BBBBBB' : '#1A2B40'}
              backgroundColor="#FFFFFF"
              logo={undefined}
            />
            {isExpired && (
              <View style={styles.expiredOverlay}>
                <Ionicons name="time-outline" size={40} color="#FFFFFF" />
                <Text style={styles.expiredOverlayText}>Hết hạn</Text>
              </View>
            )}
          </View>

          {!isExpired ? (
            <View style={styles.countdownRow}>
              <Ionicons name="timer-outline" size={18} color={countdownColor} />
              <Text style={[styles.countdownText, { color: countdownColor }]}>
                {'  '}Hết hạn sau {formatCountdown(secondsLeft)}
              </Text>
            </View>
          ) : (
            <Text style={styles.expiredText}>Mã đã hết hạn</Text>
          )}
        </>
      ) : null}

      {(isExpired || error) && !loading && (
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.refreshText}> Tạo mã mới</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  qrCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    gap: 16,
  },
  qrPlaceholder: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  qrWrapper: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: `${Colors.primary}30`,
    position: 'relative',
  },
  qrExpired: { borderColor: '#CCCCCC' },
  expiredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  expiredOverlayText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  countdownRow: { flexDirection: 'row', alignItems: 'center' },
  countdownText: { fontSize: 14, fontWeight: '600' },
  expiredText: { fontSize: 14, color: Colors.error, fontWeight: '600' },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
