import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../core/theme/colors';
import { generateInviteToken, type InviteTokenData } from '../../../core/api/inviteApi';

const QR_SIZE = 220;

function useCountdown(expiresAt: string | null): number {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return secondsLeft;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ElderlyQRInviteScreen() {
  const navigation = useNavigation();
  const [invite, setInvite] = useState<InviteTokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secondsLeft = useCountdown(invite?.expiresAt ?? null);
  const expired = invite !== null && secondsLeft === 0;

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateInviteToken();
      setInvite(data);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không thể tạo mã QR. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const isExpired = expired;
  const countdownColor =
    secondsLeft > 120 ? Colors.secondary : secondsLeft > 30 ? Colors.warning : Colors.error;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mã QR kết nối</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Instruction card */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={22} color={Colors.primary} />
          <Text style={styles.instructionText}>
            Cho người thân quét mã này bằng ứng dụng CareNest để kết nối tài khoản
          </Text>
        </View>

        {/* QR area */}
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

              {/* Countdown */}
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

          {/* Refresh button */}
          {(isExpired || error) && !loading && (
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchToken}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.refreshText}> Tạo mã mới</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Hướng dẫn</Text>
          {[
            {
              icon: 'phone-portrait-outline',
              text: 'Người thân mở ứng dụng CareNest trên điện thoại',
            },
            { icon: 'person-outline', text: 'Vào trang Hồ sơ → Thêm thành viên' },
            { icon: 'qr-code-outline', text: 'Chọn "Quét mã QR" và hướng camera vào mã này' },
            {
              icon: 'checkmark-circle-outline',
              text: 'Kết nối thành công — người thân sẽ thấy dữ liệu sức khoẻ của bạn',
            },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Ionicons
                name={step.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={Colors.primary}
                style={styles.stepIcon}
              />
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, alignItems: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scroll: { padding: 20, gap: 16 },

  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${Colors.primary}12`,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
    fontWeight: '500',
  },

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

  stepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  stepIcon: { marginTop: 1 },
  stepText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
