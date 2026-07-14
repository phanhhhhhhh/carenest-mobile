import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../core/theme/colors';
import * as storage from '../../../core/storage/secureStorage';
import api from '../../../core/api/client';
import { useAuthStore } from '../../auth/store/authStore';
import { useFamilyDashboardStore, useFamilyLinkStore } from '../store/familyStore';

/**
 * Port of Flutter's family_profile_screen.dart.
 *
 * Notes on fidelity:
 * - Flutter read `_name`/`_phone` directly from SecureStorage in
 *   `initState`/`_load` rather than from the auth provider; this port does
 *   the same via `secureStorage.getName()`/`getPhone()` instead of
 *   `useAuthStore`'s `user` object (which only carries id/name/role, no
 *   phone field).
 * - The "Add family member" AlertDialog (phone lookup + send request) is
 *   rebuilt as a `Modal`, matching the convention already used by
 *   ElderlyEmergencyContactsScreen.tsx for porting Flutter AlertDialogs.
 *   The Flutter dialog used `ScaffoldMessenger` snackbars for
 *   success/error feedback; this port uses `Alert.alert` instead (same
 *   substitution HealthThresholdScreen/ElderlyEmergencyContactsScreen use
 *   elsewhere in this codebase), since there's no SnackBar equivalent
 *   wired up yet.
 * - "Edit Profile" and "Help & Support" menu items are no-ops, matching the
 *   Flutter source (`() {}`) exactly — not stubbed out further.
 * - Notification Settings / Upgrade Premium navigate to 'NotificationSettings'
 *   / 'PremiumPlans' (Flutter: `context.go('/notification-settings')` /
 *   `context.go('/premium-plans')'). Those routes aren't registered in
 *   RootStackParamList yet (navigation files are off-limits for this port),
 *   so `useNavigation` is typed loosely with `NativeStackNavigationProp<any>`,
 *   matching the pattern used by HealthThresholdScreen.tsx.
 */

type Nav = NativeStackNavigationProp<any>;

export default function FamilyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const dashboardData = useFamilyDashboardStore((s) => s.data);
  const loadDashboard = useFamilyDashboardStore((s) => s.load);
  const elderlyName = useFamilyDashboardStore((s) => s.elderlyName());
  const healthConditions = useFamilyDashboardStore((s) => s.healthConditions());
  const totalMeds = dashboardData?.totalMedications ?? 0;

  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const linkIsLoading = useFamilyLinkStore((s) => s.isLoading);
  const linkError = useFamilyLinkStore((s) => s.error);
  const sendLinkRequest = useFamilyLinkStore((s) => s.sendLinkRequest);

  useEffect(() => {
    (async () => {
      const [storedName, storedPhone] = await Promise.all([storage.getName(), storage.getPhone()]);
      setName(storedName || 'User');
      setPhone(storedPhone || '');
    })();
  }, []);

  useEffect(() => {
    if (!dashboardData) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddFamilyDialog = () => {
    setPhoneInput('');
    setAddDialogVisible(true);
  };

  const handleSendRequest = async () => {
    const rawPhone = phoneInput.trim();
    if (!rawPhone) return;

    let elderlyId: string | null = null;
    try {
      let normalized = rawPhone;
      if (normalized.startsWith('0')) {
        normalized = `+84${normalized.substring(1)}`;
      } else if (!normalized.startsWith('+')) {
        normalized = `+84${normalized}`;
      }
      const lookupResp = await api.get(`/users/by-phone/${normalized}`);
      elderlyId = lookupResp.data?.id != null ? String(lookupResp.data.id) : null;
    } catch {
      // lookup failed
    }

    if (elderlyId == null) {
      Alert.alert('', 'No user found with that phone number');
      return;
    }

    const ok = await sendLinkRequest(elderlyId);
    setAddDialogVisible(false);
    Alert.alert('', ok ? 'Connection request sent!' : linkError || 'Could not send request');
    if (ok) {
      loadDashboard();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Avatar name={name} phone={phone} />
        <View style={{ height: 28 }} />

        {elderlyName != null && (
          <>
            <ConnectedElderly name={elderlyName} conditions={healthConditions} totalMeds={totalMeds} />
            <View style={{ height: 20 }} />
          </>
        )}

        <AddFamilyCard onPress={openAddFamilyDialog} />
        <View style={{ height: 20 }} />

        <Settings
          onEditProfile={() => {}}
          onNotificationSettings={() => navigation.navigate('NotificationSettings')}
          onUpgradePremium={() => navigation.navigate('PremiumPlans')}
          onHelpSupport={() => {}}
          onLogout={logout}
        />
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={addDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Add family member</Text>
            <View style={{ height: 16 }} />
            <Text style={styles.dialogBody}>
              Enter the elderly person&apos;s phone number to send a connection request.
            </Text>
            <View style={{ height: 16 }} />
            <View style={styles.inputWrap}>
              <Ionicons name="call" size={18} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 0912345678"
                placeholderTextColor={Colors.textHint}
                keyboardType="phone-pad"
                value={phoneInput}
                onChangeText={setPhoneInput}
              />
            </View>
            <View style={{ height: 20 }} />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setAddDialogVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogSendBtn, linkIsLoading && styles.dialogSendBtnDisabled]}
                onPress={handleSendRequest}
                disabled={linkIsLoading}
              >
                <Text style={styles.dialogSendText}>{linkIsLoading ? 'Sending...' : 'Send request'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Avatar({ name, phone }: { name: string; phone: string }) {
  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatarStack}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={56} color={Colors.secondary} />
        </View>
        <View style={styles.avatarCameraBadge}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </View>
      </View>
      <View style={{ height: 14 }} />
      <Text style={styles.avatarName}>{name}</Text>
      {phone.length > 0 && (
        <>
          <View style={{ height: 4 }} />
          <Text style={styles.avatarPhone}>{phone}</Text>
        </>
      )}
      <View style={{ height: 10 }} />
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>Family / Caregiver</Text>
      </View>
    </View>
  );
}

function ConnectedElderly({
  name,
  conditions,
  totalMeds,
}: {
  name: string;
  conditions: string[];
  totalMeds: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Ionicons name="people" size={22} color={Colors.primary} />
        <Text style={styles.cardHeaderTitle}>Connected family member</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.elderlyRow}>
        <View style={styles.elderlyAvatar}>
          <Ionicons name="body" size={28} color={Colors.primary} />
        </View>
        <View style={styles.elderlyInfo}>
          <Text style={styles.elderlyName}>{name}</Text>
          <View style={styles.elderlySubtitleRow}>
            {conditions.length > 0 && <Text style={styles.elderlySubtitle}>{conditions[0]}</Text>}
            {totalMeds > 0 && (
              <>
                {conditions.length > 0 && <Text style={styles.elderlySubtitle}> • </Text>}
                <Text style={styles.elderlySubtitle}>{`${totalMeds} medications`}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.statusDot} />
      </View>
    </View>
  );
}

function AddFamilyCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addFamilyCard} onPress={onPress}>
      <View style={styles.addFamilyIconWrap}>
        <Ionicons name="person-add" size={22} color={Colors.primary} />
      </View>
      <View style={styles.addFamilyText}>
        <Text style={styles.addFamilyTitle}>Add family member</Text>
        <Text style={styles.addFamilySubtitle}>Connect with an elderly account to monitor health</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
    </TouchableOpacity>
  );
}

function Settings({
  onEditProfile,
  onNotificationSettings,
  onUpgradePremium,
  onHelpSupport,
  onLogout,
}: {
  onEditProfile: () => void;
  onNotificationSettings: () => void;
  onUpgradePremium: () => void;
  onHelpSupport: () => void;
  onLogout: () => void;
}) {
  const items: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    bg: string;
    onPress: () => void;
  }[] = [
    { icon: 'create-outline', label: 'Edit Profile', color: Colors.primary, bg: `${Colors.primary}14`, onPress: onEditProfile },
    {
      icon: 'notifications-outline',
      label: 'Notification Settings',
      color: Colors.secondary,
      bg: `${Colors.secondary}14`,
      onPress: onNotificationSettings,
    },
    {
      icon: 'ribbon-outline',
      label: 'Upgrade Premium',
      color: Colors.warning,
      bg: `${Colors.warning}14`,
      onPress: onUpgradePremium,
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      color: Colors.textSecondary,
      bg: `${Colors.textHint}14`,
      onPress: onHelpSupport,
    },
  ];

  return (
    <View style={styles.settingsCard}>
      {items.map((item, i) => (
        <View key={i}>
          <TouchableOpacity style={styles.settingRow} onPress={item.onPress}>
            <View style={[styles.settingIconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
          </TouchableOpacity>
          <View style={styles.settingDivider} />
        </View>
      ))}

      <TouchableOpacity style={styles.settingRow} onPress={onLogout}>
        <View style={[styles.settingIconWrap, { backgroundColor: `${Colors.error}14` }]}>
          <Ionicons name="log-out" size={20} color={Colors.error} />
        </View>
        <Text style={[styles.settingLabel, { color: Colors.error }]}>Log out</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  avatarWrap: { alignItems: 'center' },
  avatarStack: { position: 'relative' },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.secondary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  avatarName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  avatarPhone: { color: Colors.textSecondary, fontSize: 14 },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: `${Colors.secondary}1A`,
  },
  roleBadgeText: { color: Colors.secondary, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  elderlyRow: { flexDirection: 'row', alignItems: 'center' },
  elderlyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elderlyInfo: { flex: 1, marginLeft: 12 },
  elderlyName: { fontWeight: '600', fontSize: 15, color: Colors.textPrimary },
  elderlySubtitleRow: { flexDirection: 'row', marginTop: 2 },
  elderlySubtitle: { color: Colors.textSecondary, fontSize: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  addFamilyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
    padding: 18,
  },
  addFamilyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFamilyText: { flex: 1, marginLeft: 14 },
  addFamilyTitle: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  addFamilySubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { flex: 1, marginLeft: 14, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  settingDivider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 72 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20 },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  dialogBody: { color: Colors.textSecondary, fontSize: 13 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(173, 181, 189, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, height: '100%' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  dialogCancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  dialogCancelText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  dialogSendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dialogSendBtnDisabled: { opacity: 0.6 },
  dialogSendText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
