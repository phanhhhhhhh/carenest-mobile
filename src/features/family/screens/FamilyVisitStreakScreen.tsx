import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { normalizeElderlyId } from '../../../core/navigation/elderlyId';
import { Colors } from '../../../core/theme/colors';
import { Alert } from '../../../shared/utils/crossPlatformAlert';
import { useFeedStore } from '../store/feedStore';
import {
  type VisitCycleType,
  type VisitEntry,
  type VisitStreak,
  useVisitStreakStore,
} from '../store/visitStreakStore';
import { submitVisitWithDuplicateConfirmation } from './familyVisitStreak/confirmationFlow';
import { buildVisitSetupPatch } from './familyVisitStreak/setup';
import { createVisitDateOptions, formatVisitDate } from './familyVisitStreak/visitDates';
import { completeVisitConfirmation } from './familyVisitStreak/visitSuccess';

type Nav = NativeStackNavigationProp<RootStackParamList, 'FamilyVisitStreak'>;
type VisitRoute = RouteProp<RootStackParamList, 'FamilyVisitStreak'>;

const CADENCES: { value: VisitCycleType; label: string }[] = [
  { value: 'WEEKLY', label: 'Mỗi tuần' },
  { value: 'MONTHLY', label: 'Mỗi tháng' },
];

function CadenceSelector({
  value,
  disabled,
  onChange,
}: {
  value: VisitCycleType | null;
  disabled: boolean;
  onChange: (value: VisitCycleType) => void;
}) {
  return (
    <View style={styles.cadenceRow} accessibilityRole="radiogroup">
      {CADENCES.map((item) => {
        const selected = value === item.value;
        return (
          <TouchableOpacity
            key={item.value}
            style={[styles.cadenceOption, selected && styles.cadenceOptionSelected]}
            onPress={() => onChange(item.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{ checked: selected, disabled }}
          >
            <Text style={[styles.cadenceText, selected && styles.cadenceTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function VisitHistory({ visits }: { visits: VisitEntry[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Lịch sử về thăm</Text>
      {visits.length === 0 ? (
        <Text style={styles.supportingText}>
          Lịch sử sẽ hiển thị sau khi gia đình ghi nhận lượt thăm đầu tiên.
        </Text>
      ) : (
        visits.map((visit) => (
          <View key={visit.id} style={styles.visitRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.successDark} />
            <View style={styles.visitContent}>
              <Text style={styles.visitName}>{visit.memberName} đã về thăm</Text>
              <Text style={styles.visitMeta}>
                {formatVisitDate(visit.visitedAt, true)}
                {visit.note ? ` · ${visit.note}` : ''}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function SetupSection({
  selection,
  submitting,
  onSelect,
  onEnable,
  onLater,
}: {
  selection: VisitCycleType | null;
  submitting: boolean;
  onSelect: (cycle: VisitCycleType) => void;
  onEnable: () => void;
  onLater: () => void;
}) {
  return (
    <View style={styles.setupCard}>
      <View style={styles.setupIcon}>
        <Ionicons name="home-outline" size={26} color={Colors.primary} />
      </View>
      <Text style={styles.setupTitle}>Nhịp về thăm nhà</Text>
      <Text style={styles.bodyText}>
        Cùng gia đình duy trì những lần về thăm đều đặn. Mỗi chu kỳ chỉ cần một thành viên xác nhận
        đã về thăm.
      </Text>
      <View style={styles.manualNote}>
        <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primaryDark} />
        <Text style={styles.manualNoteText}>
          Lượt thăm chỉ được ghi nhận khi thành viên tự xác nhận. CareNest không dùng camera để tự
          phát hiện.
        </Text>
      </View>
      <Text style={styles.fieldLabel}>Chọn chu kỳ nhắc</Text>
      <CadenceSelector value={selection} disabled={submitting} onChange={onSelect} />
      <TouchableOpacity
        style={[styles.primaryButton, (!selection || submitting) && styles.disabled]}
        onPress={onEnable}
        disabled={!selection || submitting}
        accessibilityRole="button"
        accessibilityLabel="Bật nhắc về thăm"
        accessibilityState={{ disabled: !selection || submitting, busy: submitting }}
      >
        {submitting && <ActivityIndicator size="small" color={Colors.surface} />}
        <Text style={styles.primaryButtonText}>
          {submitting ? 'Đang bật...' : 'Bật nhắc về thăm'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onLater}
        disabled={submitting}
        accessibilityRole="button"
        accessibilityLabel="Để sau"
        accessibilityState={{ disabled: submitting }}
      >
        <Text style={styles.secondaryButtonText}>Để sau</Text>
      </TouchableOpacity>
    </View>
  );
}

function StreakSummary({ streak }: { streak: VisitStreak }) {
  const cycleWord = streak.cycleType === 'MONTHLY' ? 'tháng' : 'tuần';
  const streakText =
    streak.currentStreak === 0
      ? 'Gia đình có thể bắt đầu nhịp đầu tiên bất cứ lúc nào.'
      : `${streak.currentStreak} ${cycleWord} liên tiếp có người về thăm.`;

  return (
    <View style={styles.streakCard}>
      <Text style={styles.elderlyName}>{streak.elderlyName}</Text>
      <View style={styles.streakNumberRow}>
        <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
        <Text style={styles.streakUnit}>{cycleWord}</Text>
      </View>
      <Text style={styles.streakMessage}>{streakText}</Text>
      <Text style={styles.streakMeta}>
        Dài nhất: {streak.longestStreak} {cycleWord} · Lần gần nhất:{' '}
        {formatVisitDate(streak.lastVisitAt)}
      </Text>
      <View
        style={[
          styles.cycleStatus,
          streak.visitedThisCycle ? styles.completedStatus : styles.pendingStatus,
        ]}
      >
        <Ionicons
          name={streak.visitedThisCycle ? 'checkmark-circle' : 'time-outline'}
          size={20}
          color={streak.visitedThisCycle ? Colors.successDark : Colors.primaryDark}
        />
        <Text
          style={[
            styles.cycleStatusText,
            { color: streak.visitedThisCycle ? Colors.successDark : Colors.primaryDark },
          ]}
        >
          {streak.visitedThisCycle
            ? 'Chu kỳ này gia đình đã có lượt về thăm.'
            : 'Chu kỳ này chưa có lượt thăm được ghi nhận.'}
        </Text>
      </View>
      {!streak.visitedThisCycle && streak.streakAtRisk && (
        <View style={styles.reminderWindow}>
          <Ionicons name="calendar-outline" size={19} color={Colors.warningDark} />
          <Text style={styles.reminderWindowText}>
            Nếu thuận tiện, gia đình mình có thể sắp xếp một lần về thăm trước khi chu kỳ kết thúc.
          </Text>
        </View>
      )}
      {streak.cycleEndsAt && (
        <Text style={styles.cycleEnd}>Chu kỳ kết thúc: {formatVisitDate(streak.cycleEndsAt)}</Text>
      )}
    </View>
  );
}

export default function FamilyVisitStreakScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<VisitRoute>();
  const elderlyId = normalizeElderlyId(route.params?.elderlyId);

  const streak = useVisitStreakStore((state) =>
    elderlyId ? state.byElderly[elderlyId] : undefined,
  );
  const isLoading = useVisitStreakStore((state) =>
    elderlyId ? Boolean(state.loadingByElderly[elderlyId]) : false,
  );
  const isSubmitting = useVisitStreakStore((state) =>
    elderlyId ? Boolean(state.submittingByElderly[elderlyId]) : false,
  );
  const error = useVisitStreakStore((state) =>
    elderlyId ? (state.errorsByElderly[elderlyId] ?? null) : null,
  );
  const load = useVisitStreakStore((state) => state.load);
  const confirmVisit = useVisitStreakStore((state) => state.confirmVisit);
  const updateSettings = useVisitStreakStore((state) => state.updateSettings);
  const loadFeed = useFeedStore((state) => state.load);

  const [notesByElderly, setNotesByElderly] = useState<Record<string, string>>({});
  const [daysAgoByElderly, setDaysAgoByElderly] = useState<Record<string, number>>({});
  const [setupCadenceByElderly, setSetupCadenceByElderly] = useState<
    Record<string, VisitCycleType | null>
  >({});
  const [refreshing, setRefreshing] = useState(false);

  const note = elderlyId ? (notesByElderly[elderlyId] ?? '') : '';
  const selectedDaysAgo = elderlyId ? (daysAgoByElderly[elderlyId] ?? 0) : 0;
  const setupCadence = elderlyId ? (setupCadenceByElderly[elderlyId] ?? null) : null;
  const dateOptions = createVisitDateOptions();

  useEffect(() => {
    if (!elderlyId) return;
    const controller = new AbortController();
    load(elderlyId, controller.signal);
    return () => controller.abort();
  }, [elderlyId, load]);

  const setNote = (value: string) => {
    if (!elderlyId) return;
    setNotesByElderly((current) => ({ ...current, [elderlyId]: value }));
  };

  const setSelectedDaysAgo = (value: number) => {
    if (!elderlyId) return;
    setDaysAgoByElderly((current) => ({ ...current, [elderlyId]: value }));
  };

  const setSetupCadence = (value: VisitCycleType | null) => {
    if (!elderlyId) return;
    setSetupCadenceByElderly((current) => ({ ...current, [elderlyId]: value }));
  };

  const handleEnable = async () => {
    if (!elderlyId) return;
    const patch = buildVisitSetupPatch(setupCadence);
    if (!patch) return;
    await updateSettings(elderlyId, patch);
  };

  const handleDisable = () => {
    if (!elderlyId || isSubmitting) return;
    Alert.alert(
      'Tạm dừng nhắc về thăm?',
      'CareNest sẽ ngừng gửi lời nhắc. Lịch sử và chuỗi về thăm của gia đình vẫn được giữ lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạm dừng',
          onPress: () => {
            void updateSettings(elderlyId, { enabled: false }).then((success) => {
              if (success) setSetupCadence(null);
            });
          },
        },
      ],
    );
  };

  const handleConfirm = async () => {
    if (!elderlyId || isSubmitting) return;
    const selectedDate = createVisitDateOptions().find(
      (option) => option.daysAgo === selectedDaysAgo,
    );
    if (!selectedDate) return;
    const input = { note: note.trim() || undefined, visitedAt: selectedDate.visitedAt };

    await submitVisitWithDuplicateConfirmation({
      elderlyId,
      input,
      confirmVisit,
      confirmationAlert: Alert,
      onSuccess: () => {
        void completeVisitConfirmation({
          elderlyId,
          loadFeed,
          resetInput: () => {
            setNote('');
            setSelectedDaysAgo(0);
          },
        });
      },
    });
  };

  const handleRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  let content: React.ReactNode;
  if (!elderlyId) {
    content = (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={42} color={Colors.textSecondary} />
        <Text style={styles.invalidTitle}>Không thể mở Nhịp về thăm</Text>
        <Text style={styles.invalidText}>Hồ sơ người cao tuổi không hợp lệ.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backAction}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Text style={styles.backActionText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (isLoading && !streak) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  } else if (!streak) {
    content = (
      <View style={styles.center}>
        <Text style={styles.invalidTitle}>Không tải được Nhịp về thăm</Text>
        <Text style={styles.invalidText}>{error ?? 'Vui lòng thử lại.'}</Text>
        <TouchableOpacity
          onPress={() => load(elderlyId)}
          style={styles.backAction}
          accessibilityRole="button"
          accessibilityLabel="Thử tải lại Nhịp về thăm"
        >
          <Text style={styles.backActionText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {error && <Text style={styles.error}>{error}</Text>}

        {!streak.enabled ? (
          <>
            <Text style={styles.profileContext}>Dành cho {streak.elderlyName}</Text>
            <SetupSection
              selection={setupCadence}
              submitting={isSubmitting}
              onSelect={setSetupCadence}
              onEnable={handleEnable}
              onLater={() => navigation.goBack()}
            />
            <View style={styles.pausedNotice}>
              <Ionicons name="notifications-off-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.pausedText}>
                Lời nhắc đang tạm dừng. Lịch sử vẫn được giữ lại.
              </Text>
            </View>
            <VisitHistory visits={streak.recentVisits} />
          </>
        ) : (
          <>
            <StreakSummary streak={streak} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Xác nhận đã về thăm</Text>
              <Text style={styles.supportingText}>
                Chỉ xác nhận khi bạn thực sự đã về thăm. CareNest không dùng camera để tự phát hiện.
              </Text>
              <Text style={styles.fieldLabel}>Ngày về thăm</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dateOptions.map((option) => {
                  const selected = selectedDaysAgo === option.daysAgo;
                  return (
                    <TouchableOpacity
                      key={option.daysAgo}
                      style={[styles.dateOption, selected && styles.dateOptionSelected]}
                      onPress={() => setSelectedDaysAgo(option.daysAgo)}
                      disabled={isSubmitting}
                      accessibilityRole="radio"
                      accessibilityLabel={`${option.label}, ${option.dateLabel}`}
                      accessibilityState={{ checked: selected, disabled: isSubmitting }}
                    >
                      <Text style={[styles.dateLabel, selected && styles.dateLabelSelected]}>
                        {option.label}
                      </Text>
                      {option.daysAgo < 2 && (
                        <Text style={[styles.dateValue, selected && styles.dateValueSelected]}>
                          {option.dateLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TextInput
                style={styles.noteInput}
                placeholder="Ghi chú (không bắt buộc)"
                placeholderTextColor={Colors.textHint}
                value={note}
                onChangeText={setNote}
                maxLength={500}
                multiline
                accessibilityLabel="Ghi chú cho lượt về thăm"
              />
              <Text style={styles.counter}>{note.length}/500</Text>
              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.disabled]}
                onPress={handleConfirm}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Xác nhận đã về thăm"
                accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
              >
                {isSubmitting && <ActivityIndicator size="small" color={Colors.surface} />}
                <Ionicons name="home" size={19} color={Colors.surface} />
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Đang lưu...' : 'Xác nhận đã về thăm'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.settingHeader}>
                <View style={styles.settingText}>
                  <Text style={styles.sectionTitle}>Nhắc về thăm</Text>
                  <Text style={styles.supportingText}>
                    Lời nhắc nhẹ nhàng theo chu kỳ gia đình chọn.
                  </Text>
                </View>
                <Switch
                  value
                  onValueChange={(enabled) => {
                    if (!enabled) handleDisable();
                  }}
                  disabled={isSubmitting}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={Colors.primary}
                  accessibilityRole="switch"
                  accessibilityLabel="Bật nhắc về thăm"
                  accessibilityState={{ checked: true, disabled: isSubmitting }}
                />
              </View>
              <Text style={styles.fieldLabel}>Chu kỳ nhắc</Text>
              <CadenceSelector
                value={streak.cycleType}
                disabled={isSubmitting}
                onChange={(cycleType) => {
                  if (cycleType !== streak.cycleType) {
                    void updateSettings(elderlyId, { cycleType });
                  }
                }}
              />
            </View>

            <VisitHistory visits={streak.recentVisits} />
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="chevron-back" size={25} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhịp về thăm nhà</Text>
        <View style={styles.headerSpacer} />
      </View>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 44 },
  headerTitle: { flexShrink: 1, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  invalidTitle: {
    marginTop: 12,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  invalidText: { marginTop: 6, color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  backAction: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backActionText: { color: Colors.surface, fontSize: 14, fontWeight: '700' },
  scroll: { padding: 16, gap: 16, paddingBottom: 36 },
  error: {
    color: Colors.errorDark,
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
  },
  profileContext: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  setupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  setupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLighter,
  },
  setupTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  bodyText: { fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  manualNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.primaryLighter,
  },
  manualNoteText: { flex: 1, fontSize: 13, lineHeight: 19, color: Colors.primaryDark },
  fieldLabel: { marginTop: 2, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  cadenceRow: { flexDirection: 'row', gap: 10 },
  cadenceOption: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cadenceOptionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cadenceText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  cadenceTextSelected: { color: Colors.surface },
  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: Colors.surface, fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  secondaryButtonText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  pausedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  pausedText: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  streakCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elderlyName: { maxWidth: '100%', fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  streakNumberRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 },
  streakNumber: { fontSize: 48, fontWeight: '900', color: Colors.primary },
  streakUnit: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  streakMessage: {
    maxWidth: '100%',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  streakMeta: {
    marginTop: 7,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cycleStatus: {
    width: '100%',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 12,
    padding: 12,
  },
  completedStatus: { backgroundColor: Colors.successLight },
  pendingStatus: { backgroundColor: Colors.primaryLighter },
  cycleStatusText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  reminderWindow: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.warningLight,
  },
  reminderWindowText: { flex: 1, color: Colors.warningDark, fontSize: 13, lineHeight: 19 },
  cycleEnd: { marginTop: 10, color: Colors.textSecondary, fontSize: 12.5 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  supportingText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  dateOption: {
    minWidth: 92,
    minHeight: 54,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateOptionSelected: { backgroundColor: Colors.primaryLighter, borderColor: Colors.primary },
  dateLabel: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  dateLabelSelected: { color: Colors.primaryDark },
  dateValue: { marginTop: 2, color: Colors.textSecondary, fontSize: 11 },
  dateValueSelected: { color: Colors.primary },
  noteInput: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', marginTop: -6, color: Colors.textSecondary, fontSize: 12 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { flex: 1 },
  visitRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  visitContent: { flex: 1, marginLeft: 10 },
  visitName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  visitMeta: { marginTop: 2, fontSize: 12, lineHeight: 17, color: Colors.textSecondary },
});
