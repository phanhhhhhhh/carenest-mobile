import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { useMedicationStore } from '../store/medicationStore';
import { snoozeOneOff, cancelSnooze } from '../../medication/services/medicationReminderService';
import { showErrorToast } from '../../../shared/components/toastStore';
import type { MedicationItem } from '../../../shared/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const UPCOMING_WINDOW_MS = 15 * 60 * 1000;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function ElderlyMedicationScreen() {
  const navigation = useNavigation<Nav>();

  const items = useMedicationStore((s) => s.items);
  const isLoading = useMedicationStore((s) => s.isLoading);
  const error = useMedicationStore((s) => s.error);
  const load = useMedicationStore((s) => s.load);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const controller = new AbortController();
    load(undefined, controller.signal);
    return () => controller.abort();
    // Load once on mount; `load` is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ticks the "còn X phút" countdown and the upcoming→due transition live,
  // without needing a manual refresh, for the 15-minutes-before demo flow.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleTakeNow = (med: MedicationItem) => {
    cancelSnooze(med);
    toggleTaken(med.id, showErrorToast);
  };

  const handleSnooze = async (med: MedicationItem) => {
    const ok = await snoozeOneOff(med, 10);
    const target = new Date(Date.now() + 10 * 60 * 1000);
    if (ok) {
      Alert.alert(
        '',
        `Đã hoãn nhắc nhở 10 phút — sẽ nhắc lại lúc ${pad2(target.getHours())}:${pad2(target.getMinutes())}`,
      );
    } else {
      Alert.alert('', 'Không thể đặt lại nhắc nhở trên thiết bị này');
    }
  };

  const pending = [...items.filter((m) => !m.taken)].sort((a, b) => {
    const at = a.nextDoseTime ? new Date(a.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.nextDoseTime ? new Date(b.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt;
  });
  const dueNow = pending.length > 0 ? pending[0] : null;
  const dueTimeLabel = dueNow
    ? dueNow.nextDoseTime
      ? `${pad2(new Date(dueNow.nextDoseTime).getHours())}:${pad2(new Date(dueNow.nextDoseTime).getMinutes())} hôm nay`
      : dueNow.scheduleTimes.length > 0
        ? dueNow.scheduleTimes[0]
        : ''
    : '';

  // Real-time gating: with no scheduled time we can't tell how close it is, so
  // always surface it (fallback). Otherwise only show the banner once we're
  // within the 15-minute window — "upcoming" (countdown) before the dose
  // time, "due" once it has arrived — and hide it entirely if it's still far off.
  const msUntilDue = dueNow?.nextDoseTime ? new Date(dueNow.nextDoseTime).getTime() - now : null;
  const reminderPhase: 'none' | 'upcoming' | 'due' = !dueNow
    ? 'none'
    : msUntilDue === null || msUntilDue <= 0
      ? 'due'
      : msUntilDue <= UPCOMING_WINDOW_MS
        ? 'upcoming'
        : 'none';
  const minutesUntilDue = msUntilDue !== null ? Math.max(1, Math.ceil(msUntilDue / 60_000)) : null;

  const sortedItems = [...items].sort((a, b) => {
    const at = a.nextDoseTime ? new Date(a.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.nextDoseTime ? new Date(b.nextDoseTime).getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Thuốc của tôi</Text>
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textHint} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {dueNow && reminderPhase !== 'none' && (
            <View style={[styles.dueBanner, reminderPhase === 'upcoming' && styles.upcomingBanner]}>
              <View style={styles.dueHeaderRow}>
                <Ionicons
                  name={reminderPhase === 'upcoming' ? 'time-outline' : 'alarm'}
                  size={18}
                  color={reminderPhase === 'upcoming' ? Colors.primary : Colors.warning}
                />
                <Text
                  style={[
                    styles.dueHeaderText,
                    reminderPhase === 'upcoming' && styles.upcomingHeaderText,
                  ]}
                >
                  {reminderPhase === 'upcoming' ? 'SẮP ĐẾN GIỜ UỐNG THUỐC' : 'ĐẾN GIỜ UỐNG THUỐC'}
                </Text>
              </View>
              <View style={{ height: 14 }} />
              <View style={styles.dueRow}>
                <View
                  style={[
                    styles.dueIconWrap,
                    reminderPhase === 'upcoming' && styles.upcomingIconWrap,
                  ]}
                >
                  <Ionicons
                    name="medkit"
                    size={26}
                    color={reminderPhase === 'upcoming' ? Colors.primary : Colors.warning}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.dueMedName}>
                    {dueNow.name} {dueNow.dosage}
                  </Text>
                  {!!dueNow.instructions && (
                    <Text style={styles.dueInstructions}>{dueNow.instructions}</Text>
                  )}
                  <Text style={styles.dueTimeLabel}>
                    {reminderPhase === 'upcoming'
                      ? `Còn khoảng ${minutesUntilDue} phút nữa${dueTimeLabel ? ` · ${dueTimeLabel}` : ''}`
                      : dueTimeLabel}
                  </Text>
                </View>
              </View>
              <View style={{ height: 16 }} />
              <TouchableOpacity
                style={[styles.dueTakeBtn, reminderPhase === 'upcoming' && styles.upcomingTakeBtn]}
                onPress={() => handleTakeNow(dueNow)}
              >
                <Text style={styles.dueTakeBtnText}>✓ ĐÃ UỐNG</Text>
              </TouchableOpacity>
              {reminderPhase === 'due' && (
                <>
                  <View style={{ height: 10 }} />
                  <TouchableOpacity
                    style={styles.dueSnoozeBtn}
                    onPress={() => handleSnooze(dueNow)}
                  >
                    <Text style={styles.dueSnoozeBtnText}>Hoãn 10 phút</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <View style={{ height: 24 }} />

          <Text style={styles.sectionTitle}>Hôm nay</Text>

          <View style={{ height: 14 }} />

          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Image
                source={require('../../../../assets/mascot/mascot_confused.jpg')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
              />
              <View style={{ height: 4 }} />
              <Text style={styles.emptyText}>Chưa có thuốc nào</Text>
            </View>
          ) : (
            sortedItems.map((m) => (
              <MedRow
                key={m.id}
                item={m}
                onPress={() =>
                  navigation.navigate('ElderlyMedicationHistory', {
                    medicationId: m.id,
                    medicationName: m.name,
                  })
                }
              />
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MedRow({ item, onPress }: { item: MedicationItem; onPress: () => void }) {
  const timeLabel = item.nextDoseTime
    ? `${pad2(new Date(item.nextDoseTime).getHours())}:${pad2(new Date(item.nextDoseTime).getMinutes())}`
    : item.scheduleTimes.length > 0
      ? item.scheduleTimes[0]
      : '--:--';

  return (
    <TouchableOpacity style={styles.medRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.medRowTime}>{timeLabel}</Text>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.medRowName}>
          {item.name} {item.dosage}
        </Text>
        <View style={{ height: 4 }} />
        <View style={styles.medRowStatusRow}>
          <Ionicons
            name={item.taken ? 'checkmark' : 'alarm-outline'}
            size={14}
            color={item.taken ? Colors.success : Colors.warning}
          />
          <Text
            style={[
              styles.medRowStatusText,
              { color: item.taken ? Colors.success : Colors.warning },
            ]}
          >
            {item.taken ? ' Đã uống' : ' Sắp tới'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  scroll: { padding: 20 },

  dueBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
  },
  dueHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueHeaderText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.5 },
  upcomingHeaderText: { color: Colors.primary },
  dueRow: { flexDirection: 'row', alignItems: 'center' },
  dueIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 167, 38, 0.4)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingBanner: { borderColor: Colors.primary },
  upcomingIconWrap: { borderColor: 'rgba(46, 125, 154, 0.4)' },
  upcomingTakeBtn: { backgroundColor: Colors.primary },
  dueMedName: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dueInstructions: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dueTimeLabel: { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  dueTakeBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
  },
  dueTakeBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.button.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dueSnoozeBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dueSnoozeBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.button.fontSize,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  emptyCard: {
    paddingVertical: 40,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },

  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  medRowTime: {
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  medRowName: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Colors.textPrimary },
  medRowStatusRow: { flexDirection: 'row', alignItems: 'center' },
  medRowStatusText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600' },
});
