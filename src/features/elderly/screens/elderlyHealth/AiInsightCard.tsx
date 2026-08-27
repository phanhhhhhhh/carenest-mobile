import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

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
              backgroundColor: aiLoading ? 'rgba(255, 167, 38, 0.15)' : 'rgba(67, 160, 71, 0.15)',
            },
          ]}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={Colors.warning} />
          ) : (
            <Ionicons name="sparkles" size={20} color={Colors.success} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.aiTitle}>Nhận định từ AI</Text>
            {aiLoading && <Text style={styles.aiAnalyzing}> đang phân tích...</Text>}
          </View>
          <Text style={styles.aiText}>{displayText}</Text>
        </View>
        {!aiLoading && showReload && (
          <TouchableOpacity onPress={onReload} style={{ padding: 4 }}>
            <Ionicons name="refresh" size={18} color={Colors.textHint} />
          </TouchableOpacity>
        )}
      </View>
      {!!aiError && <Text style={styles.aiError}>{aiError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  aiCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EFF7EF',
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.2)',
  },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start' },
  aiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  aiAnalyzing: { color: Colors.textSecondary, fontSize: 11, fontStyle: 'italic' },
  aiText: { marginTop: 4, color: Colors.textSecondary, fontSize: 13, lineHeight: 19.5 },
  aiError: { marginTop: 8, color: Colors.warning, fontSize: 11, fontStyle: 'italic' },
});
