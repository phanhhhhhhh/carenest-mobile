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
import { usePaymentStore, isFreePlan } from '../store/paymentStore';
import { CurrentPlanBanner, MethodCard, PlanCard } from './premiumPlans/cards';

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
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 13 },
  methodRow: { flexDirection: 'row' },
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
