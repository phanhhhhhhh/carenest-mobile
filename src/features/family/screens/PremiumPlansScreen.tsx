import React, { useState } from 'react';
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
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

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

  useMountEffect(() => {
    load();
  });

  const handleSubscribe = async () => {
    const premiumPlan = plans.find((p) => !isFreePlan(p));
    if (!premiumPlan) {
      Alert.alert('Thông báo', 'Không có gói Premium nào khả dụng');
      return;
    }

    const url = await createPayment(premiumPlan.id, selectedMethod);

    if (url && url.length > 0) {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Liên kết thanh toán', `Đường dẫn thanh toán: ${url}`);
      }
    }

    const successMsg = usePaymentStore.getState().paymentSuccess;
    if (successMsg) {
      Alert.alert('Thành công', successMsg);
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
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Gói Hội Viên CareNest Premium</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin gói cước...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
          <View style={{ height: 12 }} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ height: 16 }} />
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

          <Text style={styles.sectionTitle}>Các gói dịch vụ chăm sóc</Text>
          <Text style={styles.sectionSubtitle}>
            Nâng cấp để mở khóa chăm sóc đa người thân và báo cáo AI chuyên sâu
          </Text>
          <View style={{ height: 16 }} />

          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={subscription != null && subscription.planType === plan.id}
            />
          ))}

          <View style={{ height: 20 }} />

          {!isPremium && (
            <>
              <Text style={styles.sectionTitle}>Phương thức thanh toán an toàn</Text>
              <View style={{ height: 12 }} />
              <View style={styles.methodRow}>
                <View style={{ flex: 1 }}>
                  <MethodCard
                    icon="VNPay"
                    label="VNPay"
                    subtitle="Ngân hàng & QR Pay"
                    selected={selectedMethod === 'vnpay'}
                    onPress={() => setSelectedMethod('vnpay')}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <MethodCard
                    icon="MoMo"
                    label="MoMo"
                    subtitle="Ví điện tử MoMo"
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
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={styles.manageBtnText}>Hủy gia hạn gói Premium</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.subscribeBtn}
              disabled={isProcessing}
              onPress={handleSubscribe}
              activeOpacity={0.88}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeBtnText}>Đăng ký CareNest Premium ngay</Text>
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
  heroMascot: { width: 150, height: 150 },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  errorText: { color: '#EF4444', fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
  scroll: { padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sectionSubtitle: { color: '#64748B', fontSize: 13, marginTop: 2, lineHeight: 18 },
  methodRow: { flexDirection: 'row' },
  subscribeBtn: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeBtnText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
  manageBtn: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  manageBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
