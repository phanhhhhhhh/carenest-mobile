import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../../core/theme/colors';
import { useNotificationSettingsStore } from '../store/notificationSettingsStore';

const REMINDER_MINUTE_OPTIONS = [5, 10, 15, 30, 60];

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ToggleTile({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onChanged,
  enabled = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onChanged: (v: boolean) => void;
  enabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View
        style={[
          styles.toggleIconWrap,
          { backgroundColor: withAlpha(iconColor, enabled ? 0.1 : 0.05) },
        ]}
      >
        <Ionicons name={icon} color={enabled ? iconColor : Colors.textHint} size={20} />
      </View>
      <View style={styles.toggleTextWrap}>
        <Text style={[styles.toggleTitle, { color: enabled ? Colors.textPrimary : Colors.textSecondary }]}>
          {title}
        </Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={enabled ? onChanged : undefined}
        disabled={!enabled}
        trackColor={{ true: Colors.primary }}
      />
    </View>
  );
}

function ReminderMinutesTile({
  value,
  onChanged,
}: {
  value: number;
  onChanged: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = REMINDER_MINUTE_OPTIONS.includes(value) ? value : 15;

  return (
    <View style={styles.reminderRow}>
      <Ionicons name="timer-outline" color={Colors.textHint} size={16} />
      <Text style={styles.reminderLabel}>Nhắc trước:</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.reminderDropdown} onPress={() => setOpen(true)}>
        <Text style={styles.reminderDropdownText}>{current} phút</Text>
        <Ionicons name="chevron-down" size={14} color={Colors.primary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.optionSheet}>
            {REMINDER_MINUTE_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.optionRow}
                onPress={() => {
                  onChanged(m);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, m === current && styles.optionTextActive]}>
                  {m} phút
                </Text>
                {m === current && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function TimePickerTile({
  label,
  time,
  onSet,
}: {
  label: string;
  time: string;
  onSet: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parts = time.split(':');
  const initialHour = parseInt(parts[0], 10) || 22;
  const initialMinute = parseInt(parts[1], 10) || 0;
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const openPicker = () => {
    setHour(initialHour);
    setMinute(initialMinute);
    setOpen(true);
  };

  const confirm = () => {
    onSet(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    setOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <>
      <TouchableOpacity style={styles.timeTile} onPress={openPicker}>
        <Ionicons name="time-outline" color={Colors.primary} size={18} />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.timeTileLabel}>{label}</Text>
          <Text style={styles.timeTileValue}>{time}</Text>
        </View>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.timePickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.timePickerTitle}>Chọn giờ {label}</Text>
            <View style={styles.timePickerColumns}>
              <ScrollView style={styles.timePickerColumn}>
                {hours.map((h) => (
                  <TouchableOpacity key={h} style={styles.timePickerOption} onPress={() => setHour(h)}>
                    <Text style={[styles.timePickerOptionText, h === hour && styles.optionTextActive]}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.timePickerColon}>:</Text>
              <ScrollView style={styles.timePickerColumn}>
                {minutes.map((m) => (
                  <TouchableOpacity key={m} style={styles.timePickerOption} onPress={() => setMinute(m)}>
                    <Text style={[styles.timePickerOptionText, m === minute && styles.optionTextActive]}>
                      {String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.timePickerConfirm} onPress={confirm}>
              <Text style={styles.timePickerConfirmText}>Đồng ý</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

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

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

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
            onChanged={setMedicationReminder}
          />
          {medicationReminder && (
            <ReminderMinutesTile value={reminderMinutesBefore} onChanged={setReminderMinutes} />
          )}
          <ToggleTile
            icon="medical-outline"
            iconColor={Colors.error}
            title="Cảnh báo sức khỏe"
            subtitle="Nhận thông báo khi chỉ số sức khỏe bất thường"
            value={healthAlert}
            onChanged={setHealthAlert}
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
            onChanged={setFamilyUpdate}
          />
        </Section>

        <View style={{ height: 20 }} />

        <Section
          title="Giờ yên tĩnh"
          subtitle="Trong giờ yên tĩnh, chỉ cảnh báo SOS sẽ được gửi"
        >
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
            onChanged={(v) => {
              if (v) {
                setQuietHoursStart('22:00');
                setQuietHoursEnd('07:00');
              } else {
                setQuietHoursStart('');
                setQuietHoursEnd('');
              }
            }}
          />
          {quietHoursEnabled && (
            <View style={styles.quietHoursRow}>
              <View style={{ flex: 1 }}>
                <TimePickerTile label="Bắt đầu" time={quietHoursStart} onSet={setQuietHoursStart} />
              </View>
              <Text style={styles.toLabel}>đến</Text>
              <View style={{ flex: 1 }}>
                <TimePickerTile label="Kết thúc" time={quietHoursEnd} onSet={setQuietHoursEnd} />
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

  sectionWrap: { marginBottom: 0 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textHint,
    marginLeft: 4,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTextWrap: { flex: 1, marginLeft: 14 },
  toggleTitle: { fontSize: 14, fontWeight: '600' },
  toggleSubtitle: { fontSize: 12, color: Colors.textHint, marginTop: 2 },

  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 70,
    paddingRight: 16,
    paddingBottom: 8,
  },
  reminderLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: 8 },
  reminderDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: withAlpha(Colors.textHint, 0.3),
    borderRadius: 8,
  },
  reminderDropdownText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionText: { fontSize: 14, color: Colors.textPrimary },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },

  quietHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  toLabel: { color: Colors.textSecondary, marginHorizontal: 12 },

  timeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: withAlpha(Colors.textHint, 0.3),
    borderRadius: 12,
  },
  timeTileLabel: { color: Colors.textHint, fontSize: 10 },
  timeTileValue: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },

  timePickerSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: 260,
  },
  timePickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  timePickerColumns: { flexDirection: 'row', height: 180, alignItems: 'center' },
  timePickerColumn: { flex: 1 },
  timePickerColon: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginHorizontal: 8 },
  timePickerOption: { paddingVertical: 8, alignItems: 'center' },
  timePickerOptionText: { fontSize: 16, color: Colors.textPrimary },
  timePickerConfirm: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  timePickerConfirmText: { color: Colors.surface, fontWeight: '700', fontSize: 14 },
});
