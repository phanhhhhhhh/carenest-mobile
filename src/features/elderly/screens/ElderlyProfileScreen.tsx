import React, { useEffect, useState } from 'react';
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
import { useAuthStore } from '../../auth/store/authStore';
import { useElderlyProfileStore } from '../store/elderlyStore';
import { useLinkedFamilyStore } from '../../family/store/familyStore';
import { getName, getPhone, getRole } from '../../../core/storage/secureStorage';
import { ProfileHeader } from './elderlyProfile/ProfileHeader';
import { ConditionTags, AllergyTags, InfoRow } from './elderlyProfile/tags';
import { buildProfileMenuItems } from './elderlyProfile/menuItems';

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

  useEffect(() => {
    (async () => {
      const [n, p, r] = await Promise.all([getName(), getPhone(), getRole()]);
      setName(n || 'Người dùng');
      setPhone(p || '');
      setRole(r || 'ELDERLY');
    })();
    loadProfile();
    loadFamily();
    // Load once on mount; the loaders are stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isElderlyRole = role === 'ELDERLY';

  const handleSignOut = () => {
    logout();
  };

  const menuItems = buildProfileMenuItems(navigation);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ProfileHeader name={name} phone={phone} isElderlyRole={isElderlyRole} />

        <View style={{ height: 28 }} />

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="medical" size={22} color={Colors.primary} />
            <Text style={styles.cardHeaderText}>Hồ sơ sức khỏe</Text>
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

        <View style={{ height: 20 }} />

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="people" size={22} color={Colors.secondary} />
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
                Chưa có người thân nào kết nối.{'\n'}Nhờ người thân thêm bạn bằng số điện thoại.
              </Text>
            </View>
          ) : (
            members.map((m) => (
              <View key={m.id} style={styles.familyRow}>
                <View style={styles.familyAvatar}>
                  <Ionicons name="person" size={24} color={Colors.secondary} />
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

        <View style={{ height: 20 }} />

        <View style={styles.card}>
          {menuItems.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress}>
                <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </View>
          ))}
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuRow} onPress={handleSignOut}>
            <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(229, 57, 53, 0.08)' }]}>
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Đăng xuất</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={20} color={Colors.textHint} />
          </TouchableOpacity>
        </View>

        <View style={styles.brandFooter}>
          <Image
            source={require('../../../../assets/brand/logo_wordmark.jpg')}
            style={styles.brandFooterImage}
            resizeMode="contain"
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandFooter: { alignItems: 'center', marginTop: 24 },
  brandFooterImage: { width: 140, height: 44, opacity: 0.85 },
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },

  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeaderText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 14 },

  centerPad: { alignItems: 'center', paddingVertical: 16 },
  centerPadSmall: { alignItems: 'center', paddingVertical: 8 },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  retryLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  emptyFamilyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19.5,
    textAlign: 'center',
  },

  familyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  familyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(76, 175, 130, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  familyPhone: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { marginLeft: 14, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  menuDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 54 },
});
