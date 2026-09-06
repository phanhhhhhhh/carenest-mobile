import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useAuthStore } from '../../auth/store/authStore';
import { useCameraConsentStore } from '../../family/store/cameraConsentStore';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function ElderlyCameraConsentScreen() {
  const navigation = useNavigation();
  const userId = useAuthStore((s) => s.user?.id);
  const elderlyId = userId != null ? String(userId) : null;

  const consent = useCameraConsentStore((s) => (elderlyId ? s.byElderly[elderlyId] : undefined));
  const isLoading = useCameraConsentStore((s) => s.isLoading);
  const isSubmitting = useCameraConsentStore((s) => s.isSubmitting);
  const error = useCameraConsentStore((s) => s.error);
  const load = useCameraConsentStore((s) => s.load);
  const decide = useCameraConsentStore((s) => s.decide);

  useMountEffect(() => {
    if (elderlyId) load(elderlyId);
  });

  const handleDecide = async (accepted: boolean) => {
    if (!elderlyId) return;
    const ok = await decide(elderlyId, accepted);
    if (ok && accepted) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera an sinh</Text>
        <View style={{ width: 34 }} />
      </View>

      {isLoading && !consent ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Ionicons name="videocam-outline" size={44} color={Colors.primary} />
          <Text style={styles.title}>Ông/bà có muốn bật camera an sinh không?</Text>

          <Text style={styles.body}>
            Camera giúp con cháu ở xa nhìn thấy ông/bà khi cần và chụp ảnh lúc bấm SOS. Ông/bà toàn
            quyền quyết định:
          </Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>
              • Có thể tự tắt tạm 1–2 giờ bất cứ lúc nào (Chế độ riêng tư).
            </Text>
            <Text style={styles.bullet}>
              • Nếu từ chối, camera tắt hoàn toàn — 30 ngày sau mới hỏi lại một lần.
            </Text>
            <Text style={styles.bullet}>
              • Check-in, thuốc, Nhắc Về Thăm và nút SOS vẫn hoạt động bình thường dù không bật
              camera.
            </Text>
          </View>

          {consent && (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{consent.message}</Text>
              {consent.status === 'DECLINED' && consent.retryAfter && (
                <Text style={styles.statusMeta}>
                  Sẽ hỏi lại vào {new Date(consent.retryAfter).toLocaleDateString('vi-VN')}
                </Text>
              )}
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.acceptBtn, isSubmitting && styles.btnDisabled]}
            onPress={() => handleDecide(true)}
            disabled={isSubmitting}
          >
            <Text style={styles.acceptBtnText}>Đồng ý bật camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.declineBtn, isSubmitting && styles.btnDisabled]}
            onPress={() => handleDecide(false)}
            disabled={isSubmitting}
          >
            <Text style={styles.declineBtnText}>Không, cảm ơn</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 24, alignItems: 'center', gap: 16 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  body: { fontSize: 15, color: Colors.textPrimary, lineHeight: 23 },
  bullets: { alignSelf: 'stretch', gap: 8 },
  bullet: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  statusBox: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: { fontSize: 13.5, color: Colors.textPrimary },
  statusMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  error: { color: '#DC2626', fontSize: 13, alignSelf: 'stretch' },
  acceptBtn: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  declineBtn: {
    alignSelf: 'stretch',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  declineBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
