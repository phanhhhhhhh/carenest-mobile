import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import {
  usePaymentStore,
  isFreePlan,
  getPriceLabel,
  getPeriodLabel,
  type PlanData,
} from '../store/paymentStore';



function formatDate(dt: Date): string {
  const months = [
    'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
    'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12',
  ];
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

export default function PremiumPlansScreen() {
  const navigation = useNavigation();
  const isLoading = usePaymentStore((s) => s.isLoading);
  const isProcessing = usePaymentStore((s) => s.isProcessing);
  const error = usePaymentStore((s) => s.error);
  const plans = usePaymentStore((s) => s.plans);
  const subscription = usePaymentStore((s) => s.subscription);
  const load = usePaymentStore((s) => s.load);
  const createPayment = usePaymentStore((s) => s.createPayment);
  const cancelSubscription = usePaymentStore((s) => s.cancelSubscription);
  const clearSuccess = usePaymentStore((s) => s.clearSuccess);
  const currentPlanLabel = usePaymentStore((s) => s.currentPlanLabel());
  const isPremium = usePaymentStore((s) => s.isPremium());

  const [selectedMethod, setSelectedMethod] = useState<'vnpay' | 'momo'>('vnpay');

  useEffect(() => {
    load();
  }, []);

  const handleSubscribe = async () => {
    const premiumPlan = plans.find((p) => !isFreePlan(p));
    if (!premiumPlan) {
      Alert.alert('', 'Không có gói Premium nào khả dụng');
      return;
    }

    const url = await createPayment(premiumPlan.id, selectedMethod);

    if (url && url.length > 0) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('', `Đường dẫn thanh toán: ${url}`);
      }
    }

    const successMsg = usePaymentStore.getState().paymentSuccess;
    if (successMsg) {
      Alert.alert('', successMsg);
      clearSuccess();
      load();
    }
  };

  const confirmCancel = () => {
    Alert.alert(
      'Hủy Premium?',
      'Bạn sẽ mất quyền truy cập các tính năng Premium khi kết thúc chu kỳ thanh toán hiện tại.',
      [
        { text: 'Giữ gói hiện tại', style: 'cancel' },
        {
          text: 'Hủy gói đăng ký',
          style: 'destructive',
          onPress: async () => {
            const ok = await cancelSubscription();
            Alert.alert('', ok ? 'Đã hủy gói đăng ký' : 'Không thể hủy gói đăng ký');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Gói Premium</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <View style={{ height: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.heroWrap}>
            <Image
              source={require('../../../../assets/mascot/mascot_thumbsup_stethoscope.jpg')}
              style={styles.heroMascot}
              resizeMode="contain"
            />
          </View>
          <CurrentPlanBanner
            isPremium={isPremium}
            currentPlanLabel={currentPlanLabel}
            endDate={subscription?.expiresAt}
          />
          <View style={{ height: 24 }} />

          <Text style={styles.sectionTitle}>Chọn gói của bạn</Text>
          <View style={{ height: 4 }} />
          <Text style={styles.sectionSubtitle}>Nâng cấp để mở khóa tất cả tính năng Premium</Text>
          <View style={{ height: 16 }} />

          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={subscription != null && subscription.planType === plan.id}
            />
          ))}

          <View style={{ height: 24 }} />

          {!isPremium && (
            <>
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              <View style={{ height: 12 }} />
              <View style={styles.methodRow}>
                <View style={{ flex: 1 }}>
                  <MethodCard
                    icon="VNPay"
                    label="VNPay"
                    subtitle="Ngân hàng trực tuyến"
                    selected={selectedMethod === 'vnpay'}
                    onPress={() => setSelectedMethod('vnpay')}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <MethodCard
                    icon="MoMo"
                    label="MoMo"
                    subtitle="Ví điện tử"
                    selected={selectedMethod === 'momo'}
                    onPress={() => setSelectedMethod('momo')}
                  />
                </View>
              </View>
              <View style={{ height: 24 }} />
            </>
          )}

          {isPremium ? (
            <TouchableOpacity
              style={styles.manageBtn}
              disabled={isProcessing}
              onPress={confirmCancel}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Text style={styles.manageBtnText}>Hủy gói đăng ký</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.subscribeBtn}
              disabled={isProcessing}
              onPress={handleSubscribe}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeBtnText}>Đăng ký ngay</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


function CurrentPlanBanner({
  isPremium,
  currentPlanLabel,
  endDate,
}: {
  isPremium: boolean;
  currentPlanLabel: string;
  endDate?: string;
}) {
  const colors = isPremium ? ['#F57F17', '#FFB300'] : [Colors.primary, Colors.primaryDark];
  return (
    <View
      style={[
        styles.currentPlanCard,
        {
          backgroundColor: colors[0],
          shadowColor: colors[1],
        },
      ]}
    >
      {}
      <View style={[styles.currentPlanOverlay, { backgroundColor: colors[1] }]} />
      <View style={styles.currentPlanRow}>
        <Ionicons
          name={isPremium ? 'ribbon' : 'shield-checkmark'}
          color="#FFFFFF"
          size={28}
        />
        <View style={{ width: 12 }} />
        <View>
          <Text style={styles.currentPlanLabel}>Gói hiện tại</Text>
          <View style={{ height: 2 }} />
          <Text style={styles.currentPlanValue}>{currentPlanLabel}</Text>
        </View>
      </View>
      {isPremium && endDate && (
        <>
          <View style={{ height: 12 }} />
          <Text style={styles.currentPlanValid}>
            Có hiệu lực đến {formatDate(new Date(endDate))}
          </Text>
        </>
      )}
    </View>
  );
}


function PlanCard({ plan, isCurrent }: { plan: PlanData; isCurrent: boolean }) {
  const isRecommended = plan.id === 'PREMIUM_YEARLY';
  const priceLabel = getPriceLabel(plan);
  const periodLabel = getPeriodLabel(plan);

  return (
    <View
      style={[
        styles.planCard,
        isCurrent
          ? { borderWidth: 2, borderColor: Colors.primary }
          : isRecommended
          ? { borderWidth: 1.5, borderColor: Colors.warning }
          : null,
      ]}
    >
      <View style={styles.planCardHeaderRow}>
        <Text style={styles.planName}>{plan.name}</Text>
        {isRecommended && (
          <View style={[styles.badge, { backgroundColor: withAlpha(Colors.warning, 0.1), borderWidth: 1, borderColor: withAlpha(Colors.warning, 0.3) }]}>
            <Text style={[styles.badgeText, { color: Colors.warning }]}>Đáng giá nhất</Text>
          </View>
        )}
        {isCurrent && (
          <View style={[styles.badge, { backgroundColor: withAlpha(Colors.success, 0.1) }]}>
            <Text style={[styles.badgeText, { color: Colors.success }]}>Hiện tại</Text>
          </View>
        )}
      </View>

      <View style={{ height: 12 }} />

      <View style={styles.priceRow}>
        <Text style={styles.priceText}>{priceLabel}</Text>
        {periodLabel != null && <Text style={styles.periodText}>{periodLabel}</Text>}
      </View>

      <View style={{ height: 14 }} />
      <View style={styles.divider} />
      <View style={{ height: 10 }} />

      {plan.features.map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" color={Colors.success} size={18} />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}


function MethodCard({
  icon,
  label,
  subtitle,
  selected,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.methodCard,
        { borderColor: selected ? Colors.primary : withAlpha(Colors.textHint, 0.2), borderWidth: selected ? 2 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.methodIconWrap}>
        <Text style={styles.methodIconText}>{icon}</Text>
      </View>
      <View style={{ height: 8 }} />
      <Text style={styles.methodLabel}>{label}</Text>
      <View style={{ height: 2 }} />
      <Text style={styles.methodSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroWrap: { alignItems: 'center', marginBottom: 4 },
  heroMascot: { width: 160, height: 160 },
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12 },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  scroll: { padding: 16 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 13 },

  currentPlanCard: {
    padding: 20,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  currentPlanOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  currentPlanRow: { flexDirection: 'row', alignItems: 'center' },
  currentPlanLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  currentPlanValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  currentPlanValid: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  planCard: {
    marginBottom: 12,
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  planCardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  planName: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  priceText: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  periodText: { marginLeft: 4, marginBottom: 4, color: Colors.textSecondary, fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.divider },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { flex: 1, marginLeft: 10, color: Colors.textPrimary, fontSize: 14 },

  methodRow: { flexDirection: 'row' },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  methodIconWrap: {
    width: 48,
    height: 32,
    borderRadius: 8,
    backgroundColor: withAlpha(Colors.primary, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  methodLabel: { fontWeight: '700', color: Colors.textPrimary, fontSize: 15 },
  methodSubtitle: { color: Colors.textSecondary, fontSize: 11 },

  subscribeBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  subscribeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  manageBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBtnText: { color: Colors.error, fontSize: 16, fontWeight: '600' },
});
