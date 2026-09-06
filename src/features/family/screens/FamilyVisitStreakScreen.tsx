import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useFamilyDashboardStore } from '../store/familyStore';
import { useVisitStreakStore } from '../store/visitStreakStore';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FamilyVisitStreakScreen() {
  const navigation = useNavigation();
  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);

  const elderlyId =
    dashboardData && dashboardData.linkedElderly.length > 0
      ? (dashboardData.linkedElderly[dashboardData.selectedIndex]?.elderlyId ?? null)
      : null;

  const streak = useVisitStreakStore((s) => (elderlyId ? s.byElderly[elderlyId] : undefined));
  const isLoading = useVisitStreakStore((s) => s.isLoading);
  const isSubmitting = useVisitStreakStore((s) => s.isSubmitting);
  const error = useVisitStreakStore((s) => s.error);
  const load = useVisitStreakStore((s) => s.load);
  const confirmVisit = useVisitStreakStore((s) => s.confirmVisit);
  const updateSettings = useVisitStreakStore((s) => s.updateSettings);

  const [note, setNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useMountEffect(() => {
    loadDashboard();
  });

  useEffect(() => {
    if (elderlyId) load(elderlyId);
  }, [elderlyId, load]);

  const handleConfirm = async () => {
    if (!elderlyId) return;
    const ok = await confirmVisit(elderlyId, note.trim() || undefined);
    if (ok) setNote('');
  };

  const handleRefresh = async () => {
    if (!elderlyId) return;
    setRefreshing(true);
    await load(elderlyId);
    setRefreshing(false);
  };

  const cycleWord = streak?.cycleType === 'MONTHLY' ? 'tháng' : 'tuần';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhắc Về Thăm Nhà</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading && !streak ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.streakCard}>
            <Text style={styles.streakNumber}>{streak?.currentStreak ?? 0}</Text>
            <Text style={styles.streakLabel}>{cycleWord} liên tiếp có người về thăm</Text>
            <Text style={styles.streakSub}>
              Kỷ lục: {streak?.longestStreak ?? 0} {cycleWord} · Lần gần nhất:{' '}
              {formatDate(streak?.lastVisitAt)}
            </Text>
            {streak?.streakAtRisk && (
              <View style={styles.riskBanner}>
                <Ionicons name="alert-circle" size={16} color="#B45309" />
                <Text style={styles.riskText}>
                  {cycleWord.charAt(0).toUpperCase() + cycleWord.slice(1)} này chưa ai về thăm —
                  chuỗi sắp đứt.
                </Text>
              </View>
            )}
            {streak?.visitedThisCycle && (
              <Text style={styles.doneText}>✓ Đã có người về thăm trong {cycleWord} này</Text>
            )}
          </View>

          <View style={styles.confirmCard}>
            <Text style={styles.sectionTitle}>Xác nhận đã về thăm</Text>
            <Text style={styles.hint}>
              Chỉ xác nhận thủ công khi bạn thực sự đã về thăm nhà. Không dùng camera để tự phát
              hiện.
            </Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Ghi chú (không bắt buộc)"
              placeholderTextColor={Colors.textHint}
              value={note}
              onChangeText={setNote}
              multiline
            />
            <TouchableOpacity
              style={[styles.confirmBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={isSubmitting || !elderlyId}
            >
              <Ionicons name="home" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>
                {isSubmitting ? 'Đang lưu...' : 'Xác nhận đã về thăm'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cycleRow}>
            <Text style={styles.sectionTitle}>Chu kỳ nhắc</Text>
            <View style={styles.cycleToggle}>
              {(['WEEKLY', 'MONTHLY'] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cycleOpt, streak?.cycleType === c && styles.cycleOptActive]}
                  onPress={() => elderlyId && updateSettings(elderlyId, { cycleType: c })}
                >
                  <Text
                    style={[
                      styles.cycleOptText,
                      streak?.cycleType === c && styles.cycleOptTextActive,
                    ]}
                  >
                    {c === 'WEEKLY' ? 'Theo tuần' : 'Theo tháng'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Lịch sử về thăm</Text>
          {(streak?.recentVisits ?? []).length === 0 ? (
            <Text style={styles.hint}>Chưa có lượt về thăm nào được ghi nhận.</Text>
          ) : (
            (streak?.recentVisits ?? []).map((v) => (
              <View key={v.id} style={styles.visitRow}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.visitName}>{v.memberName} đã về thăm</Text>
                  <Text style={styles.visitMeta}>
                    {formatDate(v.visitedAt)}
                    {v.note ? ` · ${v.note}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16, gap: 16 },
  error: { color: '#DC2626', fontSize: 13 },
  streakCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakNumber: { fontSize: 48, fontWeight: '900', color: Colors.primary },
  streakLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  streakSub: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  riskText: { flex: 1, fontSize: 12.5, color: '#92400E' },
  doneText: { marginTop: 10, fontSize: 13, color: Colors.primary, fontWeight: '600' },
  confirmCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  hint: { fontSize: 12.5, color: Colors.textSecondary, lineHeight: 18 },
  noteInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 44,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 50,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  cycleRow: { gap: 10 },
  cycleToggle: { flexDirection: 'row', gap: 10 },
  cycleOpt: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cycleOptActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  cycleOptText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  cycleOptTextActive: { color: '#FFFFFF' },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  visitName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  visitMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
