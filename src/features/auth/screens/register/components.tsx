import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderGray, ErrorRed, HintGray, LabelGray, Teal, White } from './theme';
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
  label: { fontSize: 14.5, fontWeight: '600', color: LabelGray, marginBottom: 7 },
  labelError: { color: ErrorRed },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: BorderGray,
    borderRadius: 9999,
    paddingHorizontal: 18,
    height: 54,
    backgroundColor: White,
  },
  inputPillError: { borderColor: ErrorRed },
  fieldError: { fontSize: 13, color: ErrorRed, marginTop: 5, marginLeft: 16 },
  checklist: {
    backgroundColor: '#F2FAF9',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: -4,
    marginBottom: 16,
  },
  checklistTitle: { fontSize: 13.5, fontWeight: '600', color: LabelGray, marginBottom: 8 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checklistLabel: { fontSize: 13.5, color: LabelGray, marginLeft: 8 },
  checklistLabelOk: { color: Teal, fontWeight: '600' },
});
