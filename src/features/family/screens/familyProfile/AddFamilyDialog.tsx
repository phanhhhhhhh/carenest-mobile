import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { styles } from './styles';

export function AddFamilyDialog({
  visible,
  phone,
  onChangePhone,
  loading,
  onCancel,
  onSend,
}: {
  visible: boolean;
  phone: string;
  onChangePhone: (v: string) => void;
  loading: boolean;
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Thêm thành viên gia đình</Text>
          <View style={{ height: 16 }} />
          <Text style={styles.dialogBody}>
            Nhập số điện thoại của người cao tuổi hoặc người thân cùng chăm sóc để kết nối.
          </Text>
          <View style={styles.consentNotice}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#047857" />
            <Text style={styles.consentNoticeText}>
              Người cao tuổi sẽ nhận yêu cầu và phải đồng ý trước khi dữ liệu chăm sóc được chia sẻ.
            </Text>
          </View>
          <View style={{ height: 16 }} />
          <View style={styles.inputWrap}>
            <Ionicons name="call" size={18} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="VD: 0912345678"
              placeholderTextColor={Colors.textHint}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              value={phone}
              onChangeText={onChangePhone}
            />
          </View>
          <View style={{ height: 20 }} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogSendBtn, loading && styles.dialogSendBtnDisabled]}
              onPress={onSend}
              disabled={loading}
            >
              <Text style={styles.dialogSendText}>{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
