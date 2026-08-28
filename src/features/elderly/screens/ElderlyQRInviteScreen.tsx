import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { generateInviteToken, type InviteTokenData } from '../../../core/api/inviteApi';
import { useCountdown } from './elderlyQRInvite/countdown';
import { QrCard } from './elderlyQRInvite/QrCard';
import { StepsCard } from './elderlyQRInvite/StepsCard';

export default function ElderlyQRInviteScreen() {
  const navigation = useNavigation();
  const [invite, setInvite] = useState<InviteTokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secondsLeft = useCountdown(invite?.expiresAt ?? null);
  const isExpired = invite !== null && secondsLeft === 0;

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mã QR kết nối</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={22} color={Colors.primary} />
          <Text style={styles.instructionText}>
            Cho người thân quét mã này bằng ứng dụng CareNest để kết nối tài khoản
          </Text>
        </View>

        <QrCard
          loading={loading}
          error={error}
          invite={invite}
          isExpired={isExpired}
          secondsLeft={secondsLeft}
          onRefresh={fetchToken}
        />

        <StepsCard />
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
});
