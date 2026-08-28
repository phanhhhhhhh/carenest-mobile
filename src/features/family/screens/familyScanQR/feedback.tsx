import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../core/theme/colors';

export function PermissionDenied({ onGrant }: { onGrant: () => void }) {
  return (
    <View style={styles.permissionContainer}>
      <Ionicons name="camera-outline" size={64} color={Colors.primary} />
      <Text style={styles.permissionTitle}>Cần quyền truy cập camera</Text>
      <Text style={styles.permissionBody}>
        Ứng dụng cần dùng camera để quét mã QR kết nối tài khoản người cao tuổi.
      </Text>
      <TouchableOpacity style={styles.grantBtn} onPress={onGrant}>
        <Text style={styles.grantBtnText}>Cấp quyền camera</Text>
      </TouchableOpacity>
    </View>
  );
}

export function LoadingView() {
  return (
    <View style={styles.feedbackContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.feedbackTitle}>Đang kết nối...</Text>
      <Text style={styles.feedbackBody}>Vui lòng chờ trong giây lát</Text>
    </View>
  );
}

export function SuccessView({ linkedName, onDone }: { linkedName: string; onDone: () => void }) {
  return (
    <View style={styles.feedbackContainer}>
      <View style={[styles.feedbackIcon, styles.feedbackIconSuccess]}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.feedbackTitle}>Kết nối thành công!</Text>
      <Text style={styles.feedbackBody}>
        Bạn đã kết nối với{'\n'}
        <Text style={styles.feedbackName}>{linkedName}</Text>
      </Text>
      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Text style={styles.doneBtnText}>Hoàn tất</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
  onCancel,
}: {
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.feedbackContainer}>
      <View style={[styles.feedbackIcon, styles.feedbackIconError]}>
        <Ionicons name="close" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.feedbackTitle}>Kết nối thất bại</Text>
      <Text style={styles.feedbackBody}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Ionicons name="refresh" size={18} color="#FFFFFF" />
        <Text style={styles.retryBtnText}> Thử lại</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelLink} onPress={onCancel}>
        <Text style={styles.cancelLinkText}>Hủy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  grantBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  grantBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  feedbackContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  feedbackIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  feedbackIconSuccess: { backgroundColor: Colors.secondary },
  feedbackIconError: { backgroundColor: Colors.error },
  feedbackTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  feedbackBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  feedbackName: { color: Colors.primary, fontWeight: '700' },
  doneBtn: {
    marginTop: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelLink: { paddingVertical: 8 },
  cancelLinkText: { color: Colors.textSecondary, fontSize: 14 },
});
