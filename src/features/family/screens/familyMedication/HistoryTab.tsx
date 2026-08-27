import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import type { MedicationItem, MedicationLogEntry } from '../../../../shared/types';
import { formatLogDate } from './constants';

interface Props {
  items: MedicationItem[];
  selectedMedId: string | null;
  logs: MedicationLogEntry[];
  logsError: string | null;
  onSelectMed: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export function HistoryTab({
  items,
  selectedMedId,
  logs,
  logsError,
  onSelectMed,
  refreshing,
  onRefresh,
}: Props) {
  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Chưa có thuốc nào để xem lịch sử</Text>
      </View>
    );
  }
  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      <View style={styles.chipsWrap}>
        {items.map((m) => {
          const isSelected = selectedMedId === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.historyChip, isSelected && styles.historyChipSelected]}
              onPress={() => onSelectMed(m.id)}
            >
              <Text style={[styles.historyChipText, isSelected && styles.historyChipTextSelected]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 20 }} />
      {selectedMedId === null ? (
        <View style={styles.historyHintBox}>
          <Text style={styles.historyHintText}>
            Chọn 1 loại thuốc phía trên để xem lịch sử 30 ngày
          </Text>
        </View>
      ) : logsError !== null ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{logsError}</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.historyHintBox}>
          <Text style={styles.historyHintText}>Chưa có lịch sử uống thuốc</Text>
        </View>
      ) : (
        logs.map((log) => (
          <View key={log.id} style={styles.logRow}>
            <Ionicons
              name={log.status === 'TAKEN' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={log.status === 'TAKEN' ? Colors.success : Colors.error}
            />
            <Text style={styles.logDate}>{formatLogDate(log.takenAt)}</Text>
            <View style={{ flex: 1 }} />
            <Text
              style={[
                styles.logStatus,
                { color: log.status === 'TAKEN' ? Colors.success : Colors.error },
              ]}
            >
              {log.status === 'TAKEN' ? 'Đã uống' : 'Bỏ lỡ'}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContent: { padding: 16 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, marginTop: 12, textAlign: 'center' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  historyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyChipSelected: { backgroundColor: 'rgba(46,125,154,0.15)', borderColor: Colors.primary },
  historyChipText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  historyChipTextSelected: { color: Colors.primary },
  historyHintBox: { paddingTop: 40, alignItems: 'center' },
  historyHintText: { color: Colors.textHint, fontSize: 13, textAlign: 'center' },
  errorText: { color: Colors.error, fontSize: 13 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  logDate: { fontSize: 13, color: Colors.textPrimary, marginLeft: 10 },
  logStatus: { fontSize: 12, fontWeight: '600' },
});
