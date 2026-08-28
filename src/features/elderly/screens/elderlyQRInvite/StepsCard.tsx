import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'phone-portrait-outline', text: 'Người thân mở ứng dụng CareNest trên điện thoại' },
  { icon: 'person-outline', text: 'Vào trang Hồ sơ → Thêm thành viên' },
  { icon: 'qr-code-outline', text: 'Chọn "Quét mã QR" và hướng camera vào mã này' },
  {
    icon: 'checkmark-circle-outline',
    text: 'Kết nối thành công — người thân sẽ thấy dữ liệu sức khoẻ của bạn',
  },
];

export function StepsCard() {
  return (
    <View style={styles.stepsCard}>
      <Text style={styles.stepsTitle}>Hướng dẫn</Text>
      {STEPS.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <Ionicons name={step.icon} size={20} color={Colors.primary} style={styles.stepIcon} />
          <Text style={styles.stepText}>{step.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  stepIcon: { marginTop: 1 },
  stepText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
