import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorRed, HintGray, Teal } from './theme';
import { PASSWORD_RULES } from './validators';

interface PillFieldProps {
  label: string;
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
}

export function PillField({ label, error, touched, children }: PillFieldProps) {
  const showError = !!(touched && error);
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, showError && styles.labelError]}>{label}</Text>
      <View style={[styles.inputPill, showError && styles.inputPillError]}>{children}</View>
      {showError && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

/** Live checklist under the password field - elderly-friendly: always visible
 *  while typing, no tooltips, each rule ticks green. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <View style={styles.checklist}>
      <Text style={styles.checklistTitle}>Mật khẩu cần có:</Text>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <View key={rule.key} style={styles.checklistRow}>
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={ok ? Teal : HintGray}
            />
            <Text style={[styles.checklistLabel, ok && styles.checklistLabelOk]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  labelError: { color: ErrorRed },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#F8FAFC',
  },
  inputPillError: { borderColor: ErrorRed, backgroundColor: '#FFF5F5' },
  fieldError: { fontSize: 12.5, color: ErrorRed, marginTop: 4, marginLeft: 12 },
  checklist: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 16,
  },
  checklistTitle: { fontSize: 13, fontWeight: '700', color: '#0F766E', marginBottom: 8 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checklistLabel: { fontSize: 13, color: '#64748B', marginLeft: 8 },
  checklistLabelOk: { color: '#0F766E', fontWeight: '600' },
});
