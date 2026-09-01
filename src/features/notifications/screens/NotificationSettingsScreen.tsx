import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { showErrorToast } from '../../../shared/components/toastStore';
import { useNotificationSettingsStore } from '../store/notificationSettingsStore';
import { Section, ToggleTile } from './notificationSettings/tiles';
import { ReminderMinutesTile } from './notificationSettings/ReminderMinutesTile';
import { TimePickerTile } from './notificationSettings/TimePickerTile';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const isLoading = useNotificationSettingsStore((s) => s.isLoading);
  const medicationReminder = useNotificationSettingsStore((s) => s.medicationReminder);
  const reminderMinutesBefore = useNotificationSettingsStore((s) => s.reminderMinutesBefore);
  const healthAlert = useNotificationSettingsStore((s) => s.healthAlert);
  const familyUpdate = useNotificationSettingsStore((s) => s.familyUpdate);
  const quietHoursEnabled = useNotificationSettingsStore((s) => s.quietHoursEnabled);
  const quietHoursStart = useNotificationSettingsStore((s) => s.quietHoursStart);
  const quietHoursEnd = useNotificationSettingsStore((s) => s.quietHoursEnd);
  const load = useNotificationSettingsStore((s) => s.load);
  const setMedicationReminder = useNotificationSettingsStore((s) => s.setMedicationReminder);
  const setReminderMinutes = useNotificationSettingsStore((s) => s.setReminderMinutes);
  const setHealthAlert = useNotificationSettingsStore((s) => s.setHealthAlert);
  const setFamilyUpdate = useNotificationSettingsStore((s) => s.setFamilyUpdate);
  const setQuietHoursStart = useNotificationSettingsStore((s) => s.setQuietHoursStart);
  const setQuietHoursEnd = useNotificationSettingsStore((s) => s.setQuietHoursEnd);

  useMountEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  });

  const withSaveToast =
    <T,>(setter: (v: T) => Promise<boolean>) =>
    async (v: T) => {
      const ok = await setter(v);
      if (!ok) showErrorToast('Không thể lưu cài đặt, vui lòng thử lại.');
    };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mascotBanner}>
          <Image
            source={require('../../../../assets/mascot/mascot_notifications.jpg')}
            style={styles.mascotBannerImage}
            resizeMode="contain"
          />
        </View>
        <Section title="Loại cảnh báo">
          <ToggleTile
            icon="medkit-outline"
            iconColor={Colors.primary}
            title="Nhắc uống thuốc"
            subtitle="Nhận thông báo khi đến giờ uống thuốc"
            value={medicationReminder}
            onChanged={withSaveToast(setMedicationReminder)}
          />
          {medicationReminder && (
            <ReminderMinutesTile
              value={reminderMinutesBefore}
              onChanged={withSaveToast(setReminderMinutes)}
            />
          )}
          <ToggleTile
            icon="medical-outline"
            iconColor={Colors.error}
            title="Cảnh báo sức khỏe"
            subtitle="Nhận thông báo khi chỉ số sức khỏe bất thường"
            value={healthAlert}
            onChanged={withSaveToast(setHealthAlert)}
          />
          <ToggleTile
            icon="warning"
            iconColor={Colors.sosPrimary}
            title="Cảnh báo khẩn cấp SOS"
            subtitle="Luôn được bật — cảnh báo SOS không thể tắt"
            value={true}
            enabled={false}
            onChanged={() => {}}
          />
          <ToggleTile
            icon="people"
            iconColor={Colors.secondary}
            title="Cập nhật gia đình"
            subtitle="Nhận thông báo về yêu cầu kết nối gia đình và thay đổi trạng thái"
            value={familyUpdate}
            onChanged={withSaveToast(setFamilyUpdate)}
          />
        </Section>

        <View style={{ height: 20 }} />

        <Section title="Giờ yên tĩnh" subtitle="Trong giờ yên tĩnh, chỉ cảnh báo SOS sẽ được gửi">
          <ToggleTile
            icon="moon"
            iconColor="#7B1FA2"
            title="Không làm phiền"
            subtitle={
              quietHoursEnabled
                ? `${quietHoursStart} – ${quietHoursEnd}`
                : 'Tất cả thông báo được gửi bình thường'
            }
            value={quietHoursEnabled}
            onChanged={async (v) => {
              const [ok1, ok2] = v
                ? await Promise.all([setQuietHoursStart('22:00'), setQuietHoursEnd('07:00')])
                : await Promise.all([setQuietHoursStart(''), setQuietHoursEnd('')]);
              if (!ok1 || !ok2) showErrorToast('Không thể lưu cài đặt, vui lòng thử lại.');
            }}
          />
          {quietHoursEnabled && (
            <View style={styles.quietHoursRow}>
              <View style={{ flex: 1 }}>
                <TimePickerTile
                  label="Bắt đầu"
                  time={quietHoursStart}
                  onSet={withSaveToast(setQuietHoursStart)}
                />
              </View>
              <Text style={styles.toLabel}>đến</Text>
              <View style={{ flex: 1 }}>
                <TimePickerTile
                  label="Kết thúc"
                  time={quietHoursEnd}
                  onSet={withSaveToast(setQuietHoursEnd)}
                />
              </View>
            </View>
          )}
        </Section>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mascotBanner: { alignItems: 'center', marginBottom: 8 },
  mascotBannerImage: { width: 130, height: 130 },
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16 },
  quietHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  toLabel: { color: Colors.textSecondary, marginHorizontal: 12 },
});
