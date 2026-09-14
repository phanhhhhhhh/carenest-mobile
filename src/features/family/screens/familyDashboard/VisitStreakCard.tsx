import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { Shadows } from '../../../../core/theme/spacing';
import type { VisitStreak } from '../../store/visitStreakStore';
import { formatVisitDate } from '../familyVisitStreak/visitDates';
import { getVisitCardState } from './visitCardState';

interface VisitStreakCardProps {
  elderlyName: string;
  streak?: VisitStreak;
  submitting: boolean;
  error: string | null;
  onSetup: () => void;
  onDetails: () => void;
  onQuickConfirm: () => void;
  onRetry: () => void;
}

export function VisitStreakCard({
  elderlyName,
  streak,
  submitting,
  error,
  onSetup,
  onDetails,
  onQuickConfirm,
  onRetry,
}: VisitStreakCardProps) {
  const state = getVisitCardState(streak, error);
  const cycleWord = streak?.cycleType === 'MONTHLY' ? 'tháng' : 'tuần';

  if (state === 'loading') {
    return (
      <View style={styles.card} accessibilityLabel="Đang tải Nhịp về thăm">
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="home-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Nhịp về thăm nhà</Text>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="home-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.title}>Nhịp về thăm nhà</Text>
            <Text style={styles.subtitle}>Chưa tải được thông tin.</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Thử tải lại Nhịp về thăm"
        >
          <Ionicons name="refresh" size={18} color={Colors.primary} />
          <Text style={styles.outlineButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'disabled') {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="home-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.title}>Nhịp về thăm nhà</Text>
            <Text style={styles.profileName}>Dành cho {elderlyName}</Text>
          </View>
        </View>
        <Text style={styles.message}>Chọn lịch nhắc phù hợp với gia đình.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onSetup}
          accessibilityRole="button"
          accessibilityLabel="Thiết lập Nhịp về thăm"
        >
          <Text style={styles.primaryButtonText}>Thiết lập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completed = state === 'completed';
  const reminder = state === 'reminder';
  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <View style={styles.titleRow}>
        <View style={[styles.iconBox, completed && styles.completedIcon]}>
          <Ionicons
            name={completed ? 'checkmark-circle' : 'home-outline'}
            size={22}
            color={completed ? Colors.successDark : Colors.primary}
          />
        </View>
        <View style={styles.titleContent}>
          <Text style={styles.title}>Nhịp về thăm nhà</Text>
          <Text style={styles.profileName}>Dành cho {elderlyName}</Text>
        </View>
        <View
          style={styles.streakBadge}
          accessibilityLabel={`Chuỗi ${streak?.currentStreak ?? 0} ${cycleWord}`}
        >
          <Text style={styles.streakNumber}>{streak?.currentStreak ?? 0}</Text>
          <Text style={styles.streakUnit}>{cycleWord}</Text>
        </View>
      </View>

      <Text style={styles.message}>
        {completed ? 'Chu kỳ này đã có người về thăm.' : 'Chu kỳ này chưa có lượt thăm.'}
      </Text>

      {!completed && streak?.cycleEndsAt && (
        <Text style={styles.cycleEnd}>Chu kỳ kết thúc: {formatVisitDate(streak.cycleEndsAt)}</Text>
      )}

      {reminder && (
        <View style={styles.reminderBox}>
          <Ionicons name="calendar-outline" size={18} color={Colors.warningDark} />
          <Text style={styles.reminderText}>
            Nếu thuận tiện, gia đình mình có thể sắp xếp một lần về thăm.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {!completed && (
          <TouchableOpacity
            style={[styles.primaryButton, styles.flexButton, submitting && styles.disabled]}
            onPress={onQuickConfirm}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Xác nhận đã về thăm ngay bây giờ"
            accessibilityState={{ disabled: submitting, busy: submitting }}
          >
            {submitting && <ActivityIndicator size="small" color={Colors.surface} />}
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Đang lưu...' : 'Xác nhận đã về thăm'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.outlineButton, !completed && styles.flexButton]}
          onPress={onDetails}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Xem chi tiết Nhịp về thăm"
          accessibilityState={{ disabled: submitting }}
        >
          <Text style={styles.outlineButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.sm,
  },
  completedCard: { backgroundColor: Colors.successLight, borderColor: '#A7F3D0' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLighter,
  },
  completedIcon: { backgroundColor: '#A7F3D0' },
  titleContent: { flex: 1, minWidth: 0 },
  title: { flex: 1, color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  profileName: { marginTop: 2, color: Colors.textSecondary, fontSize: 12.5, lineHeight: 17 },
  subtitle: { marginTop: 2, color: Colors.textSecondary, fontSize: 13 },
  message: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  cycleEnd: { color: Colors.textSecondary, fontSize: 12.5 },
  streakBadge: { minWidth: 48, alignItems: 'center' },
  streakNumber: { color: Colors.primaryDark, fontSize: 23, fontWeight: '900' },
  streakUnit: { color: Colors.textSecondary, fontSize: 10.5, fontWeight: '700' },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 11,
    borderRadius: 11,
    backgroundColor: Colors.warningLight,
  },
  reminderText: { flex: 1, color: Colors.warningDark, fontSize: 12.5, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  outlineButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  outlineButtonText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  flexButton: { flexGrow: 1, flexBasis: 150 },
  disabled: { opacity: 0.5 },
});
