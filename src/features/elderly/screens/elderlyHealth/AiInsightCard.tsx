import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AiInsightCard({
  displayText,
  aiLoading,
  aiError,
  showReload,
  onReload,
}: {
  displayText: string;
  aiLoading: boolean;
  aiError: string | null;
  showReload: boolean;
  onReload: () => void;
}) {
  return (
    <View style={styles.aiCard}>
      <View style={styles.aiRow}>
        <View
          style={[
            styles.aiIconWrap,
            {
              backgroundColor: aiLoading ? '#FEF3C7' : '#DCFCE7',
            },
          ]}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color="#D97706" />
          ) : (
            <Ionicons name="sparkles" size={22} color="#15803D" />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={styles.aiTitle}>Bác sĩ AI CareNest nhận định</Text>
            {!aiLoading && showReload && (
              <TouchableOpacity
                onPress={onReload}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="refresh" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          {aiLoading && (
            <Text style={styles.aiAnalyzing}>Đang phân tích các chỉ số mới nhất của Bác...</Text>
          )}
          <Text style={styles.aiText}>{displayText}</Text>
        </View>
      </View>
      {!!aiError && <Text style={styles.aiError}>{aiError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  aiCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start' },
  aiIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 15, fontWeight: '800', color: '#14532D' },
  aiAnalyzing: { color: '#B45309', fontSize: 12.5, fontWeight: '500', marginTop: 2 },
  aiText: { marginTop: 6, color: '#166534', fontSize: 14, lineHeight: 21, fontWeight: '500' },
  aiError: { marginTop: 8, color: '#DC2626', fontSize: 12, fontWeight: '500' },
});
