import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { Shadows } from '../../../core/theme/spacing';
import { useAuthStore } from '../../auth/store/authStore';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { useLinkedFamilyStore } from '../../family/store/familyStore';
import { getName, getPhone, getRole } from '../../../core/storage/secureStorage';
import { ProfileHeader } from './elderlyProfile/ProfileHeader';
import { ConditionTags, AllergyTags, InfoRow } from './elderlyProfile/tags';
import { buildProfileMenuItems } from './elderlyProfile/menuItems';
import { useMountEffect } from '../../../shared/hooks/useMountEffect';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ElderlyProfileScreen() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ELDERLY');

  const profile = useElderlyProfileStore((s) => s.profile);
  const profileLoading = useElderlyProfileStore((s) => s.isLoading);
  const profileError = useElderlyProfileStore((s) => s.error);
  const loadProfile = useElderlyProfileStore((s) => s.load);

  const members = useLinkedFamilyStore((s) => s.members);
  const familyLoading = useLinkedFamilyStore((s) => s.isLoading);
  const loadFamily = useLinkedFamilyStore((s) => s.load);

  useMountEffect(() => {
    (async () => {
      const [n, p, r] = await Promise.all([getName(), getPhone(), getRole()]);
      setName(n || 'Người dùng');
      setPhone(p || '');
      setRole(r || 'ELDERLY');
    })();
    loadProfile();
    loadFamily();
  });

  const isElderlyRole = role === 'ELDERLY';

  const handleSignOut = () => {
    logout();
  };

  const menuItems = buildProfileMenuItems(navigation);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileHeader name={name} phone={phone} isElderlyRole={isElderlyRole} />

        <View style={{ height: 24 }} />

        {/* Health Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="medical" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.cardHeaderText}>Hồ sơ sức khỏe cá nhân</Text>
          </View>
          <View style={styles.divider} />

          {profileLoading ? (
            <View style={styles.centerPad}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : profileError ? (
            <View style={styles.centerPad}>
              <Text style={styles.errorText}>{profileError}</Text>
              <View style={{ height: 8 }} />
              <TouchableOpacity onPress={() => loadProfile()}>
                <Text style={styles.retryLink}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ConditionTags conditions={profile?.healthConditions ?? []} />
              {!!profile?.bloodType && (
                <>
                  <View style={{ height: 14 }} />
                  <InfoRow label="Nhóm máu" value={profile.bloodType} />
                </>
              )}
              {profile?.weight != null && (
                <>
                  <View style={{ height: 8 }} />
                  <InfoRow label="Cân nặng" value={`${profile.weight} kg`} />
                </>
              )}
              {profile?.height != null && (
                <>
                  <View style={{ height: 8 }} />
                  <InfoRow label="Chiều cao" value={`${profile.height} cm`} />
                </>
              )}
              {(profile?.allergies ?? []).length > 0 && (
                <>
                  <View style={{ height: 14 }} />
                  <AllergyTags allergies={profile!.allergies} />
                </>
              )}
              {!!profile?.notes && (
                <>
                  <View style={{ height: 14 }} />
                  <InfoRow label="Ghi chú" value={profile.notes} />
                </>
              )}
            </>
          )}
        </View>

        <View style={{ height: 18 }} />

        {/* Connected Family Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: Colors.secondaryLighter }]}>
              <Ionicons name="people" size={20} color={Colors.secondaryDark} />
            </View>
            <Text style={styles.cardHeaderText}>Người thân đã kết nối</Text>
          </View>
          <View style={styles.divider} />

          {familyLoading && members.length === 0 ? (
            <View style={styles.centerPad}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : members.length === 0 ? (
            <View style={styles.centerPadSmall}>
              <Text style={styles.emptyFamilyText}>
                Chưa có người thân nào kết nối.{'\n'}Mở mã QR mời để người thân quét và kết nối
                ngay.
              </Text>
            </View>
          ) : (
            members.map((m) => (
              <View key={m.id} style={styles.familyRow}>
                <View style={styles.familyAvatar}>
                  <Ionicons name="person" size={20} color={Colors.secondaryDark} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.familyName}>{m.name}</Text>
                  <Text style={styles.familyPhone}>{m.phone}</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 18 }} />

        {/* Settings Menu Card */}
        <View style={styles.card}>
          {menuItems.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuRow} onPress={handleSignOut} activeOpacity={0.7}>
            <View style={[styles.menuIconWrap, { backgroundColor: Colors.errorLight }]}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Đăng xuất</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
          </TouchableOpacity>
        </View>

        <View style={styles.brandFooter}>
          <Image
            source={require('../../../../assets/brand/logo_wordmark.jpg')}
            style={styles.brandFooterImage}
            resizeMode="contain"
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandFooter: { alignItems: 'center', marginTop: 28, marginBottom: 8 },
  brandFooterImage: { width: 140, height: 44, opacity: 0.8 },
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },

  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 14 },

  centerPad: { alignItems: 'center', paddingVertical: 16 },
  centerPadSmall: { alignItems: 'center', paddingVertical: 10 },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  retryLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  emptyFamilyText: {
    color: Colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },

  familyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  familyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.secondaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  familyPhone: { color: Colors.textSecondary, fontSize: 12.5, marginTop: 2 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { marginLeft: 14, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  menuDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 54 },
});
