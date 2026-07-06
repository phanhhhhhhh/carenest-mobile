import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────────

class PlanData {
  final String id;
  final String name;
  final int price;
  final String? currency;
  final List<String> features;

  const PlanData({
    required this.id,
    required this.name,
    required this.price,
    this.currency,
    this.features = const [],
  });

  factory PlanData.fromJson(Map<String, dynamic> j) => PlanData(
        id: j['id'] as String? ?? 'FREE',
        name: j['name'] as String? ?? '',
        price: (j['price'] as num?)?.toInt() ?? 0,
        currency: j['currency'] as String?,
        features: (j['features'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
      );

  bool get isFree => id == 'FREE';
  String get priceLabel => isFree ? 'Free' : '${price.toInt().toString()}đ';
  String? get periodLabel {
    if (id == 'PREMIUM_MONTHLY') return '/month';
    if (id == 'PREMIUM_YEARLY') return '/year';
    return null;
  }
}

class SubscriptionData {
  final String planId;
  final String status; // ACTIVE, CANCELLED, EXPIRED
  final DateTime? startDate;
  final DateTime? endDate;
  final bool autoRenew;

  const SubscriptionData({
    this.planId = 'FREE',
    this.status = 'ACTIVE',
    this.startDate,
    this.endDate,
    this.autoRenew = false,
  });

  factory SubscriptionData.fromJson(Map<String, dynamic> j) =>
      SubscriptionData(
        planId: j['planId'] as String? ?? 'FREE',
        status: j['status'] as String? ?? 'ACTIVE',
        startDate: j['startDate'] != null
            ? DateTime.tryParse(j['startDate'] as String)
            : null,
        endDate: j['endDate'] != null
            ? DateTime.tryParse(j['endDate'] as String)
            : null,
        autoRenew: j['autoRenew'] as bool? ?? false,
      );

  bool get isPremium =>
      planId.startsWith('PREMIUM') && status == 'ACTIVE';
}

// ── State ──────────────────────────────────────────────────────────────

class PaymentState {
  final bool isLoading;
  final bool isProcessing;
  final String? error;
  final List<PlanData> plans;
  final SubscriptionData? subscription;
  final String? paymentUrl;
  final String? paymentSuccess;

  const PaymentState({
    this.isLoading = false,
    this.isProcessing = false,
    this.error,
    this.plans = const [],
    this.subscription,
    this.paymentUrl,
    this.paymentSuccess,
  });

  PaymentState copyWith({
    bool? isLoading,
    bool? isProcessing,
    String? error,
    List<PlanData>? plans,
    SubscriptionData? subscription,
    String? paymentUrl,
    String? paymentSuccess,
  }) =>
      PaymentState(
        isLoading: isLoading ?? this.isLoading,
        isProcessing: isProcessing ?? this.isProcessing,
        error: error,
        plans: plans ?? this.plans,
        subscription: subscription ?? this.subscription,
        paymentUrl: paymentUrl,
        paymentSuccess: paymentSuccess,
      );

  String get currentPlanLabel {
    final sub = subscription;
    if (sub == null || sub.planId == 'FREE') return 'Free Plan';
    return sub.planId.replaceAll('_', ' ').toLowerCase().split(' ').map((w) =>
        w.isNotEmpty
            ? '${w[0].toUpperCase()}${w.substring(1)}'
            : '').join(' ');
  }

  bool get isPremium =>
      subscription != null && subscription!.isPremium;
}

// ── Notifier ───────────────────────────────────────────────────────────

class PaymentNotifier extends StateNotifier<PaymentState> {
  final Dio _dio;

  PaymentNotifier(this._dio) : super(const PaymentState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final results = await Future.wait([
        _dio.get('/payment/plans'),
        _dio.get('/payment/subscription'),
      ]);

      final plansRaw = results[0].data['plans'] as List<dynamic>? ?? [];
      final plans = plansRaw
          .map((e) => PlanData.fromJson(e as Map<String, dynamic>))
          .toList();

      SubscriptionData? sub;
      try {
        sub = SubscriptionData.fromJson(
            results[1].data as Map<String, dynamic>);
      } catch (_) {
        sub = null;
      }

      state = state.copyWith(
        isLoading: false,
        plans: plans,
        subscription: sub,
      );
    } on DioException catch (e) {
      // If backend 404, use hardcoded defaults
      if (e.response?.statusCode == 404) {
        state = state.copyWith(
          isLoading: false,
          plans: _defaultPlans,
        );
        return;
      }
      state = state.copyWith(
        isLoading: false,
        error: 'Could not load plans: ${e.message}',
      );
    }
  }

  Future<String?> createPayment(String planId, {String method = 'vnpay'}) async {
    state = state.copyWith(isProcessing: true, error: null, paymentSuccess: null);
    try {
      final endpoint = method == 'momo'
          ? '/payment/momo/create'
          : '/payment/vnpay/create';
      final resp = await _dio.post(endpoint, data: {'planType': planId});
      final data = resp.data as Map<String, dynamic>;
      final url = data['paymentUrl'] as String? ?? data['payUrl'] as String?;

      if (url != null && url.isNotEmpty) {
        state = state.copyWith(isProcessing: false, paymentUrl: url);
        return url;
      }

      // Some gateways return a deep-link or QR code
      state = state.copyWith(
        isProcessing: false,
        paymentSuccess: 'Payment initiated. Please complete in your banking app.',
      );
      return null;
    } on DioException catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Payment failed: ${e.message}',
      );
      return null;
    }
  }

  Future<bool> cancelSubscription() async {
    state = state.copyWith(isProcessing: true);
    try {
      await _dio.post('/payment/cancel');
      await load();
      state = state.copyWith(isProcessing: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Could not cancel: ${e.message}',
      );
      return false;
    }
  }

  void clearPaymentUrl() => state = state.copyWith(paymentUrl: null);
  void clearSuccess() => state = state.copyWith(paymentSuccess: null);

  static const _defaultPlans = [
    PlanData(id: 'FREE', name: 'Free Plan', price: 0, features: [
      'Monitor 1 elderly profile',
      '7-day data history',
      'Basic health tracking',
      'SOS alerts',
    ]),
    PlanData(id: 'PREMIUM_MONTHLY', name: 'Premium Monthly', price: 49000,
        currency: 'VND', features: [
      'Monitor multiple elderly profiles',
      'Unlimited data history',
      'AI Weekly Summary Reports',
      'Export health reports as PDF',
      'Priority support',
    ]),
    PlanData(id: 'PREMIUM_YEARLY', name: 'Premium Yearly', price: 399000,
        currency: 'VND', features: [
      'All Premium Monthly features',
      '2 months free (save 17%)',
    ]),
  ];
}

final paymentProvider =
    StateNotifierProvider.autoDispose<PaymentNotifier, PaymentState>(
  (ref) => PaymentNotifier(ref.watch(dioProvider)),
);
