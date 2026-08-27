import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { getPeriodLabel, getPriceLabel, type PlanData } from '../../store/paymentStore';
import { formatDate, withAlpha } from './utils';

export function CurrentPlanBanner({
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
    <View style={[styles.currentPlanCard, { backgroundColor: colors[0], shadowColor: colors[1] }]}>
      <View style={[styles.currentPlanOverlay, { backgroundColor: colors[1] }]} />
      <View style={styles.currentPlanRow}>
        <Ionicons name={isPremium ? 'ribbon' : 'shield-checkmark'} color="#FFFFFF" size={28} />
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

export function PlanCard({ plan, isCurrent }: { plan: PlanData; isCurrent: boolean }) {
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
          <View
            style={[
              styles.badge,
              {
                backgroundColor: withAlpha(Colors.warning, 0.1),
                borderWidth: 1,
                borderColor: withAlpha(Colors.warning, 0.3),
              },
            ]}
          >
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
      style={[
        styles.methodCard,
        {
          borderColor: selected ? Colors.primary : withAlpha(Colors.textHint, 0.2),
          borderWidth: selected ? 2 : 1,
        },
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
  currentPlanCard: {
    padding: 20,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  currentPlanOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
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
});
