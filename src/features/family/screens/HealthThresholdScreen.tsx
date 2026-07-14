import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import {
  useHealthThresholdStore,
  getDisplayType,
  getUnit,
  getRangeDisplay,
  isBloodPressure,
  type ThresholdItem,
  type RecommendData,
} from '../store/healthThresholdStore';

/**
 * Port of Flutter's health_threshold_screen.dart.
 *
 * Notes on fidelity:
 * - Flutter's screen reads `elderlyId`/`elderlyName` from
 *   `familyDashboardProvider` (a StateNotifierProvider watched via riverpod).
 *   The RN equivalent is `useFamilyDashboardStore` (see family_provider.dart
 *   port comment in familyStore.ts) — `elderlyId()`/`elderlyName()` mirror the
 *   Flutter getters of the same name.
 * - The Flutter "AI recommend" banner used a `LinearGradient`
 *   (0xFFE8F5E9 -> 0xFFF1F8E9). There is no gradient dependency available
 *   here (no new npm deps allowed), so it is approximated with a flat
 *   background color roughly halfway between the two stops. Noted as the one
 *   unfaithful visual spot.
 * - This screen has no navigation route registered yet in RootStackParamList
 *   (navigation files are off-limits for this port), so `useNavigation` is
 *   typed loosely, matching the pattern already used by
 *   ElderlyEditProfileScreen.tsx for the same situation.
 */

const METRIC_TYPES = ['BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'HEART_RATE', 'WEIGHT'] as const;

function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'BLOOD_PRESSURE':
      return 'heart';
    case 'BLOOD_GLUCOSE':
      return 'water';
    case 'HEART_RATE':
      return 'pulse';
    case 'WEIGHT':
      return 'speedometer';
    default:
      return 'medkit';
  }
}

function colorFor(type: string): string {
  switch (type) {
    case 'BLOOD_PRESSURE':
      return Colors.error;
    case 'BLOOD_GLUCOSE':
      return '#1565C0';
    case 'HEART_RATE':
      return Colors.secondary;
    case 'WEIGHT':
      return Colors.warning;
    default:
      return Colors.primary;
  }
}

// TODO(routing): this screen is expected to be pushed as 'HealthThreshold'
// from the family dashboard. Route needs to be registered in
// RootStackParamList by the navigation owner.
type Nav = NativeStackNavigationProp<any>;

export default function HealthThresholdScreen() {
  const navigation = useNavigation<Nav>();

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyId = useFamilyDashboardStore((s) => s.elderlyId());
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName()) ?? 'Loved one';

  const isLoading = useHealthThresholdStore((s) => s.isLoading);
  const isSaving = useHealthThresholdStore((s) => s.isSaving);
  const thresholds = useHealthThresholdStore((s) => s.thresholds);
  const load = useHealthThresholdStore((s) => s.load);
  const create = useHealthThresholdStore((s) => s.create);
  const update = useHealthThresholdStore((s) => s.update);
  const remove = useHealthThresholdStore((s) => s.delete);
  const getRecommendations = useHealthThresholdStore((s) => s.getRecommendations);
  const clearRecommendations = useHealthThresholdStore((s) => s.clearRecommendations);
  const findFor = useHealthThresholdStore((s) => s.findFor);

  const [recommendDialogVisible, setRecommendDialogVisible] = useState(false);
  const [pendingRecs, setPendingRecs] = useState<RecommendData[] | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMetricType, setSheetMetricType] = useState<string>('BLOOD_PRESSURE');
  const [sheetExisting, setSheetExisting] = useState<ThresholdItem | null>(null);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minValueSecondary, setMinValueSecondary] = useState('');
  const [maxValueSecondary, setMaxValueSecondary] = useState('');
  const [alertFamily, setAlertFamily] = useState(true);

  useEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (elderlyId) {
      load(elderlyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderlyId]);

  const openEditSheet = (metricType: string, existing: ThresholdItem | null) => {
    setSheetMetricType(metricType);
    setSheetExisting(existing);
    setMinValue(existing?.minValue != null ? String(existing.minValue) : '');
    setMaxValue(existing?.maxValue != null ? String(existing.maxValue) : '');
    setMinValueSecondary(existing?.minValueSecondary != null ? String(existing.minValueSecondary) : '');
    setMaxValueSecondary(existing?.maxValueSecondary != null ? String(existing.maxValueSecondary) : '');
    setAlertFamily(existing?.alertFamily ?? true);
    setSheetVisible(true);
  };

  const closeSheet = () => setSheetVisible(false);

  const parseNum = (s: string): number | undefined => {
    const trimmed = s.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isNaN(n) ? undefined : n;
  };

  const handleSaveSheet = async () => {
    if (!elderlyId) return;
    const params = {
      minValue: parseNum(minValue),
      maxValue: parseNum(maxValue),
      minValueSecondary: parseNum(minValueSecondary),
      maxValueSecondary: parseNum(maxValueSecondary),
      alertFamily,
    };
    if (sheetExisting) {
      await update(elderlyId, sheetExisting.id, params);
    } else {
      await create(elderlyId, { metricType: sheetMetricType, ...params });
    }
    setSheetVisible(false);
  };

  const handleDeleteSheet = async () => {
    if (!elderlyId || !sheetExisting) return;
    setSheetVisible(false);
    await remove(elderlyId, sheetExisting.id);
  };

  const handleRecommend = async () => {
    if (!elderlyId) return;
    const recs = await getRecommendations(elderlyId);
    if (recs != null && recs.length > 0) {
      setPendingRecs(recs);
      setRecommendDialogVisible(true);
    } else {
      Alert.alert('', 'No recommendations available');
    }
  };

  const applyAllRecommendations = async () => {
    if (!elderlyId || !pendingRecs) return;
    setRecommendDialogVisible(false);
    for (const r of pendingRecs) {
      await create(elderlyId, {
        metricType: r.metricType,
        minValue: r.minValue,
        maxValue: r.maxValue,
        minValueSecondary: r.minValueSecondary,
        maxValueSecondary: r.maxValueSecondary,
      });
    }
    clearRecommendations();
    setPendingRecs(null);
  };

  const renderAppBar = () => (
    <View style={styles.appBar}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.appBarTitle} numberOfLines={1}>
        Health Thresholds — {elderlyName}
      </Text>
      <View style={styles.backBtn} />
    </View>
  );

  if (!elderlyId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {renderAppBar()}
        <View style={styles.center}>
          <Ionicons name="people-outline" size={56} color={Colors.textHint} />
          <View style={{ height: 16 }} />
          <Text style={styles.emptyText}>No elderly person linked yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isBP = sheetMetricType === 'BLOOD_PRESSURE';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderAppBar()}

      {isLoading && thresholds.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* AI recommend banner */}
          <View style={styles.recommendBanner}>
            <View style={styles.recommendIconWrap}>
              <Ionicons name="sparkles" size={20} color={Colors.success} />
            </View>
            <Text style={styles.recommendText}>
              AI can analyze the health profile and suggest personalized thresholds for each
              metric.
            </Text>
            <TouchableOpacity
              style={styles.recommendBtn}
              disabled={isSaving}
              onPress={handleRecommend}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.recommendBtnText}>Recommend</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />

          <Text style={styles.sectionTitle}>Alert Thresholds</Text>
          <View style={{ height: 4 }} />
          <Text style={styles.sectionSubtitle}>
            Set personal limits — AI will alert when exceeded
          </Text>
          <View style={{ height: 16 }} />

          {METRIC_TYPES.map((type) => {
            const existing = findFor(type);
            return (
              <ThresholdCard
                key={type}
                type={type}
                existing={existing}
                onPress={() => openEditSheet(type, existing)}
              />
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Edit/create threshold bottom sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={closeSheet}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHandle} />
              <View style={{ height: 16 }} />
              <View style={styles.sheetTitleRow}>
                <Ionicons name={iconFor(sheetMetricType)} size={24} color={colorFor(sheetMetricType)} />
                <View style={{ width: 10 }} />
                <Text style={styles.sheetTitle}>
                  {sheetExisting
                    ? `Edit ${getDisplayType({ metricType: sheetMetricType } as ThresholdItem)} Threshold`
                    : `Set ${getDisplayType({ metricType: sheetMetricType } as ThresholdItem)} Threshold`}
                </Text>
              </View>
              <View style={{ height: 6 }} />
              <Text style={styles.sheetUnit}>
                Unit: {getUnit({ metricType: sheetMetricType } as ThresholdItem)}
              </Text>
              <View style={{ height: 20 }} />

              {isBP ? (
                <>
                  <View style={styles.fieldRow}>
                    <NumberField
                      label="Systolic Min"
                      value={minValue}
                      onChangeText={setMinValue}
                    />
                    <View style={{ width: 12 }} />
                    <NumberField
                      label="Diastolic Min"
                      value={minValueSecondary}
                      onChangeText={setMinValueSecondary}
                    />
                  </View>
                  <View style={{ height: 12 }} />
                  <View style={styles.fieldRow}>
                    <NumberField
                      label="Systolic Max"
                      value={maxValue}
                      onChangeText={setMaxValue}
                    />
                    <View style={{ width: 12 }} />
                    <NumberField
                      label="Diastolic Max"
                      value={maxValueSecondary}
                      onChangeText={setMaxValueSecondary}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.fieldRow}>
                  <NumberField label="Min Value" value={minValue} onChangeText={setMinValue} />
                  <View style={{ width: 12 }} />
                  <NumberField label="Max Value" value={maxValue} onChangeText={setMaxValue} />
                </View>
              )}

              <View style={{ height: 14 }} />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Alert family when out of range</Text>
                <Switch
                  value={alertFamily}
                  onValueChange={setAlertFamily}
                  trackColor={{ true: Colors.primary }}
                />
              </View>

              <View style={{ height: 20 }} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSheet}>
                <Text style={styles.saveBtnText}>
                  {sheetExisting ? 'Update' : 'Save Threshold'}
                </Text>
              </TouchableOpacity>

              {sheetExisting && (
                <>
                  <View style={{ height: 10 }} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteSheet}>
                    <Text style={styles.deleteBtnText}>Delete Threshold</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* AI recommendations dialog */}
      <Modal
        visible={recommendDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRecommendDialogVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <View style={styles.dialogTitleRow}>
              <Ionicons name="sparkles" size={24} color={Colors.primary} />
              <View style={{ width: 8 }} />
              <Text style={styles.dialogTitle}>AI Recommendations</Text>
            </View>
            <View style={{ height: 12 }} />
            <Text style={styles.dialogBody}>
              Gemini AI analyzed the health profile and suggests the following thresholds. Apply
              them?
            </Text>
            <View style={{ height: 20 }} />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setRecommendDialogVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity style={styles.dialogApplyBtn} onPress={applyAllRecommendations}>
                <Text style={styles.dialogApplyText}>Apply All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.numberFieldWrap}>
      <Text style={styles.numberFieldLabel}>{label}</Text>
      <TextInput
        style={styles.numberFieldInput}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={Colors.textHint}
      />
    </View>
  );
}

function ThresholdCard({
  type,
  existing,
  onPress,
}: {
  type: string;
  existing: ThresholdItem | null;
  onPress: () => void;
}) {
  const displayType = getDisplayType({ metricType: type } as ThresholdItem);
  const unit = getUnit({ metricType: type } as ThresholdItem);
  const color = colorFor(type);
  const isSet = existing != null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: isSet ? 'rgba(67, 160, 71, 0.3)' : 'rgba(173, 181, 189, 0.15)' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={iconFor(type)} size={22} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{displayType}</Text>
        <View style={{ height: 3 }} />
        <Text style={[styles.cardSubtitle, { color: isSet ? Colors.textSecondary : Colors.textHint }]}>
          {isSet ? `${getRangeDisplay(existing)} ${unit}` : 'Tap to set range'}
        </Text>
      </View>
      <View
        style={[
          styles.statusPill,
          { backgroundColor: isSet ? 'rgba(67, 160, 71, 0.1)' : 'rgba(173, 181, 189, 0.06)' },
        ]}
      >
        <Text style={[styles.statusPillText, { color: isSet ? Colors.success : Colors.textHint }]}>
          {isSet ? 'Set' : 'Not set'}
        </Text>
      </View>
      <View style={{ width: 4 }} />
      <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  scroll: { padding: 16 },

  recommendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EEF6EA',
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.2)',
  },
  recommendIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(67, 160, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendText: {
    flex: 1,
    marginLeft: 12,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  recommendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  recommendBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 13 },

  card: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  cardSubtitle: { fontSize: 13 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: 12, fontWeight: '600' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textHint,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flexShrink: 1 },
  sheetUnit: { color: Colors.textSecondary, fontSize: 13 },

  fieldRow: { flexDirection: 'row' },
  numberFieldWrap: { flex: 1 },
  numberFieldLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  numberFieldInput: {
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 14, color: Colors.textPrimary, flex: 1, marginRight: 12 },

  saveBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { color: Colors.error, fontSize: 15, fontWeight: '600' },

  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  dialogTitleRow: { flexDirection: 'row', alignItems: 'center' },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  dialogBody: { color: Colors.textSecondary, fontSize: 14 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  dialogCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  dialogCancelText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  dialogApplyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dialogApplyText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
