import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../../core/theme/colors';

export function ConditionTags({ conditions }: { conditions: string[] }) {
  if (conditions.length === 0) {
    return <Text style={styles.noDataText}>Chưa ghi nhận bệnh lý nào</Text>;
  }
  return (
    <View style={styles.tagsWrap}>
      {conditions.map((c) => {
        const lower = c.toLowerCase();
        const color =
          lower === 'diabetes'
            ? Colors.warning
            : lower === 'hypertension'
              ? Colors.error
              : Colors.primary;
        return (
          <View
            key={c}
            style={[styles.tag, { backgroundColor: `${color}1A`, borderColor: `${color}4D` }]}
          >
            <Text style={[styles.tagText, { color }]}>{c}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function AllergyTags({ allergies }: { allergies: string[] }) {
  return (
    <View>
      <Text style={styles.allergyLabel}>Dị ứng thuốc</Text>
      <View style={{ height: 8 }} />
      <View style={styles.tagsWrap}>
        {allergies.map((a) => (
          <View key={a} style={styles.allergyTag}>
            <Text style={styles.allergyTagText}>{a}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noDataText: { color: Colors.textSecondary, fontSize: 14 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 13, fontWeight: '500' },
  allergyLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  allergyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.3)',
  },
  allergyTagText: { color: Colors.error, fontSize: 13, fontWeight: '500' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoLabel: { width: 90, color: Colors.textSecondary, fontSize: 13 },
  infoValue: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: '500' },
});
