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
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mã QR kết nối người thân</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionCard}>
          <View style={styles.instructionIconWrap}>
            <Ionicons name="information-circle" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.instructionText}>
            Bác hãy đưa mã QR này cho con cháu quét bằng ứng dụng CareNest để kết nối tài khoản.
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

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scroll: { padding: 20, gap: 16 },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E6F7F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#99E6E0',
  },
  instructionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    lineHeight: 21,
    fontWeight: '600',
  },
});
