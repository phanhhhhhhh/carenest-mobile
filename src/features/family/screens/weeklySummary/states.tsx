import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { WeeklySummaryData } from '../../store/weeklySummaryStore';
import { SummaryCard } from './cards';

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
      <View style={{ height: 16 }} />
      <Text style={styles.errorText}>{error}</Text>
      <View style={{ height: 16 }} />
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color={Colors.surface} />
        <Text style={styles.retryBtnText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

export function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <View style={styles.center}>
      <Image
        source={require('../../../../../assets/mascot/mascot_dashboard.jpg')}
        style={{ width: 150, height: 150 }}
        resizeMode="contain"
      />
      <View style={{ height: 4 }} />
      <Text style={styles.emptyTitle}>Chưa có báo cáo hàng tuần nào</Text>
      <View style={{ height: 6 }} />
      <Text style={styles.emptySubtitle}>
        Tổng kết sức khỏe hàng tuần do AI tạo{'\n'}sẽ xuất hiện tại đây
      </Text>
      <View style={{ height: 24 }} />
      <TouchableOpacity style={styles.generateBtn} onPress={onGenerate}>
        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        <Text style={styles.generateBtnText}>Tạo báo cáo đầu tiên</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SummaryList({
  summaries,
  refreshing,
  onRefresh,
}: {
  summaries: WeeklySummaryData[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {summaries.map((s, i) => (
        <SummaryCard key={s.id || i} summary={s} isLatest={i === 0} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryBtnText: { color: Colors.surface, fontSize: 14, fontWeight: '600' },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 96 },
});
