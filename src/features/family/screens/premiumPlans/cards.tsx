import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import { getPeriodLabel, getPriceLabel, type PlanData } from '../../store/paymentStore';
import { formatDate } from './utils';

export function CurrentPlanBanner({
  isPremium,
  currentPlanLabel,
  endDate,
}: {
  isPremium: boolean;
  currentPlanLabel: string;
  endDate?: string;
}) {
  return (
    <View
      style={[styles.currentPlanCard, isPremium ? styles.planCardPremium : styles.planCardFree]}
    >
      <View style={styles.currentPlanRow}>
        <View style={styles.planIconWrap}>
          <Ionicons name={isPremium ? 'ribbon' : 'shield-checkmark'} color="#FFFFFF" size={26} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.currentPlanLabel}>GÓI DỊCH VỤ HIỆN TẠI</Text>
          <Text style={styles.currentPlanValue}>{currentPlanLabel}</Text>
        </View>
      </View>
      {isPremium && endDate && (
        <>
          <View style={{ height: 12 }} />
          <Text style={styles.currentPlanValid}>
            ✓ Có hiệu lực đến {formatDate(new Date(endDate))}
          </Text>
        </>
      )}
    </View>
  );
}

export function PlanCard({ plan, isCurrent }: { plan: PlanData; isCurrent: boolean }) {
  const isRecommended = plan.id === 'PREMIUM_YEARLY';
  const priceLabel = getPriceLabel(plan);
  const periodLabel = getPeriodLabel(plan);

  return (
    <View
      style={[
        styles.planCard,
        isCurrent ? styles.planCardCurrent : isRecommended ? styles.planCardRecommended : null,
      ]}
    >
      <View style={styles.planCardHeaderRow}>
        <Text style={styles.planName}>{plan.name}</Text>
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="sparkles" size={12} color="#FFFFFF" />
            <Text style={styles.recommendedBadgeText}>TIẾT KIỆM NHẤT</Text>
          </View>
        )}
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>ĐANG SỬ DỤNG</Text>
          </View>
        )}
      </View>

      <View style={{ height: 14 }} />

      <View style={styles.priceRow}>
        <Text style={styles.priceText}>{priceLabel}</Text>
        {periodLabel != null && (
          <Text style={styles.periodText}>/{periodLabel.replace('/ ', '')}</Text>
        )}
      </View>

      <View style={{ height: 16 }} />
      <View style={styles.divider} />
      <View style={{ height: 14 }} />

      {plan.features.map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" color={Colors.primary} size={18} />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

export function MethodCard({
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
      style={[styles.methodCard, selected && styles.methodCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.methodIconWrap}>
        <Text style={styles.methodIconText}>{icon}</Text>
      </View>
      <View style={{ height: 10 }} />
      <Text style={styles.methodLabel}>{label}</Text>
      <Text style={styles.methodSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  currentPlanCard: {
    padding: 22,
    borderRadius: 22,
    ...Shadows.lg,
  },
  planCardPremium: {
    backgroundColor: '#D97706',
  },
  planCardFree: {
    backgroundColor: Colors.primary,
  },
  planIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanRow: { flexDirection: 'row', alignItems: 'center' },
  currentPlanLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  currentPlanValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 2 },
  currentPlanValid: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },

  planCard: {
    marginBottom: 14,
    padding: 22,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  planCardCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  planCardRecommended: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  planCardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  planName: { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedBadgeText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.4 },
  currentBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.successDark,
    letterSpacing: 0.4,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceText: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -0.5 },
  periodText: { marginLeft: 6, color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.divider },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  featureText: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },

  methodCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLighter,
  },
  methodIconWrap: {
    width: 52,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconText: { color: Colors.primary, fontSize: 13, fontWeight: '800' },
  methodLabel: { fontWeight: '800', color: Colors.textPrimary, fontSize: 15 },
  methodSubtitle: { color: Colors.textSecondary, fontSize: 11.5, marginTop: 2, fontWeight: '500' },
});
