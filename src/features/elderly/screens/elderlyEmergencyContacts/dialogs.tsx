import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';
import { styles } from './styles';

export function AddContactDialog({
  visible,
  name,
  phone,
  relationship,
  onChangeName,
  onChangePhone,
  onChangeRelationship,
  onCancel,
  onAdd,
}: {
  visible: boolean;
  name: string;
  phone: string;
  relationship: string;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeRelationship: (v: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Thêm liên hệ khẩn cấp</Text>
          <View style={{ height: 16 }} />
          <View style={styles.inputWrap}>
            <Ionicons name="person" size={18} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor={Colors.textHint}
              value={name}
              onChangeText={onChangeName}
            />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.inputWrap}>
            <Ionicons name="call" size={18} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor={Colors.textHint}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={onChangePhone}
            />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.inputWrap}>
            <Ionicons name="people" size={18} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mối quan hệ (VD: Con trai, Bác sĩ...)"
              placeholderTextColor={Colors.textHint}
              value={relationship}
              onChangeText={onChangeRelationship}
            />
          </View>
          <View style={{ height: 20 }} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogAddBtn} onPress={onAdd}>
              <Text style={styles.dialogAddText}>Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmDeleteContactDialog({
  visible,
  contactName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  contactName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Xóa liên hệ?</Text>
          <View style={{ height: 8 }} />
          <Text style={styles.dialogBody}>Xóa {contactName} khỏi danh sách liên hệ khẩn cấp?</Text>
          <View style={{ height: 20 }} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onConfirm}>
              <Text style={styles.dialogDeleteText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
