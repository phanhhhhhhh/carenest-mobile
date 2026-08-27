import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { useMedicationStore } from '../store/medicationStore';
import { showErrorToast } from '../../../shared/components/toastStore';

export default function ProactiveReminderCard() {
  const items = useMedicationStore((s) => s.items);
  const toggleTaken = useMedicationStore((s) => s.toggleTaken);

  const pending = items.filter((m) => !m.taken);
  if (pending.length === 0) return null;

  const next = pending[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={0.7}
        onPress={() => toggleTaken(next.id, showErrorToast)}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={24} color={Colors.warning} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>⏰ Đến giờ uống thuốc</Text>
          <Text style={styles.medName}>
            {next.name} — {next.dosage}
          </Text>
          {!!next.instructions && <Text style={styles.instructions}>{next.instructions}</Text>}
        </View>
        <TouchableOpacity
          style={styles.takeButton}
          onPress={() => toggleTaken(next.id, showErrorToast)}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.takeButtonText}>Uống</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 154, 0.06)',
    overflow: 'hidden',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
  },
  instructions: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  takeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
    gap: 4,
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
